<?php

declare(strict_types=1);

/**
 * CLI-only, read-only database overview for deploy verification.
 * Prints row counts, order coverage by shop/currency/month, migration
 * markers and the TOP-LEVEL KEYS (never values) of one raw order payload,
 * so field names can be checked without dumping customer data.
 *
 * Usage: php scripts/db_status.php
 */

require __DIR__ . '/../app/Core/Autoloader.php';

use App\Core\App;
use App\Core\Database;

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('This script can only be run from the command line.');
}

\App\Core\Autoloader::register('App', __DIR__ . '/../app');
App::bootstrap(dirname(__DIR__));
$db = Database::connection();

function out(string $s): void { fwrite(STDOUT, $s . PHP_EOL); }
function rows(PDO $db, string $sql): array { return $db->query($sql)->fetchAll(); }

out('server: ' . $db->getAttribute(PDO::ATTR_SERVER_VERSION));
foreach (['orders', 'order_items', 'order_adjustments', 'products', 'product_variants', 'daily_profit', 'settings', 'sync_logs', 'api_logs', 'dpd_shipments', 'turum_prices'] as $t) {
    try {
        out(sprintf('%-18s %d', $t, (int) $db->query("SELECT COUNT(*) FROM `$t`")->fetchColumn()));
    } catch (\Throwable $e) {
        out(sprintf('%-18s (missing)', $t));
    }
}

$cols = array_column(rows($db, 'SHOW COLUMNS FROM orders'), 'Field');
out('orders columns: ' . implode(',', $cols));
$hasShop = in_array('shop', $cols, true);
out('daily_profit columns: ' . implode(',', array_column(rows($db, 'SHOW COLUMNS FROM daily_profit'), 'Field')));
out('daily_profit indexes: ' . implode(',', array_unique(array_column(rows($db, 'SHOW INDEX FROM daily_profit'), 'Key_name'))));

$shopExpr = $hasShop ? 'shop' : "'-'";
foreach (rows($db, "SELECT DATE_FORMAT(order_date,'%Y-%m') m, $shopExpr shop, currency, COUNT(*) n, ROUND(SUM(grand_total),2) total, MIN(exchange_rate_to_base) rmin, MAX(exchange_rate_to_base) rmax FROM orders GROUP BY m, shop, currency ORDER BY m, shop, currency") as $r) {
    out('orders ' . implode(' | ', array_map('strval', $r)));
}
foreach (rows($db, "SELECT status_type, status, COUNT(*) n FROM orders WHERE order_date >= '2026-09-01' GROUP BY status_type, status ORDER BY n DESC") as $r) {
    out('status ' . implode(' | ', array_map('strval', $r)));
}
foreach (rows($db, "SELECT payment_method, COUNT(*) n FROM orders WHERE order_date >= '2026-09-01' GROUP BY payment_method") as $r) {
    out('payment ' . implode(' | ', array_map('strval', $r)));
}
foreach (rows($db, "SELECT setting_key, setting_value FROM settings WHERE setting_group IN ('sync','profit_costs') ORDER BY setting_key") as $r) {
    out('setting ' . $r['setting_key'] . ' = ' . $r['setting_value']);
}
foreach (rows($db, 'SELECT job_name, status, started_at, records_processed, records_failed, LEFT(COALESCE(error_message,\'\'),160) err FROM sync_logs ORDER BY id DESC LIMIT 6') as $r) {
    out('sync ' . implode(' | ', array_map('strval', $r)));
}
$raw = $db->query("SELECT raw_payload FROM orders ORDER BY order_date DESC LIMIT 1")->fetchColumn();
if (is_string($raw)) {
    $o = json_decode($raw, true) ?: [];
    out('raw order keys: ' . implode(',', array_keys($o)));
    foreach (['Shipping', 'Payment', 'UTM'] as $k) {
        if (isset($o[$k]) && is_array($o[$k])) {
            out("raw $k keys: " . implode(',', array_keys($o[$k])));
        }
    }
    $item = $o['Items']['Item'] ?? null;
    if (is_array($item)) {
        $first = array_is_list($item) ? $item[0] : $item;
        out('raw item keys: ' . implode(',', array_keys($first)));
    }
}
