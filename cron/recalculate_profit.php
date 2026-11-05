<?php

declare(strict_types=1);

/**
 * Rebuilds daily_profit (one row per day x shop) from orders, order_items
 * (Turum cost snapshots), order_adjustments (COD handling fee) and the
 * profit_costs settings. See App\Services\ProfitCalculator for the
 * formula and what counts as missing.
 *
 * Default window: the last 45 days (order statuses keep changing for
 * days); --since/--until for a full rebuild. Rows in the window are
 * deleted and re-inserted in one transaction, so a day whose orders all
 * disappear (e.g. cancelled) does not keep a stale row.
 *
 * Usage: php cron/recalculate_profit.php [--since=2026-10-01] [--until=2026-11-05] [--dry-run]
 */

require __DIR__ . '/../app/Core/Autoloader.php';

use App\Core\App;
use App\Core\Database;
use App\Core\Logger;
use App\Repositories\SyncLogRepository;
use App\Services\ProfitCalculator;

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('This script can only be run from the command line.');
}

\App\Core\Autoloader::register('App', __DIR__ . '/../app');
App::bootstrap(dirname(__DIR__));

function out(string $m): void { fwrite(STDOUT, $m . PHP_EOL); }

$opts = ['since' => null, 'until' => null, 'dry_run' => false];
foreach (array_slice($argv, 1) as $arg) {
    if ($arg === '--dry-run') {
        $opts['dry_run'] = true;
    } elseif (preg_match('/^--(since|until)=(\d{4}-\d{2}-\d{2})$/', $arg, $m)) {
        $opts[$m[1]] = $m[2];
    }
}
$until = $opts['until'] ?? date('Y-m-d');
$since = $opts['since'] ?? date('Y-m-d', strtotime($until . ' -44 days'));

$db = Database::connection();
$syncLogs = new SyncLogRepository();
$runId = $opts['dry_run'] ? null : $syncLogs->start('recalculate_profit');

try {
    $settings = [];
    foreach ($db->query("SELECT setting_key, setting_value FROM settings WHERE setting_group = 'profit_costs'")->fetchAll() as $r) {
        $settings[$r['setting_key']] = $r['setting_value'];
    }
    $calc = new ProfitCalculator($settings, (string) App::config('app.base_currency'));

    // Per-order rows; item/adjustment aggregates in derived tables so the
    // order row is never multiplied by the join.
    $stmt = $db->prepare(
        "SELECT o.id, o.order_date, o.shop, o.currency, o.unas_exchange_value, o.exchange_rate_to_base,
                o.grand_total, o.grand_total_net, o.subtotal, o.shipping_fee_charged, o.discount_total,
                o.status_type, o.status, o.payment_method,
                COALESCE(i.units_total, 0) units_total, COALESCE(i.units_matched, 0) units_matched,
                COALESCE(i.cogs_matched, 0) cogs_matched, COALESCE(a.handling_total, 0) handling_total
         FROM orders o
         LEFT JOIN (
            SELECT order_id, SUM(quantity) units_total,
                   SUM(CASE WHEN turum_unit_cost IS NOT NULL THEN quantity ELSE 0 END) units_matched,
                   SUM(COALESCE(turum_unit_cost, 0) * quantity) cogs_matched
            FROM order_items GROUP BY order_id
         ) i ON i.order_id = o.id
         LEFT JOIN (
            SELECT order_id, SUM(COALESCE(price_gross, 0) * quantity) handling_total
            FROM order_adjustments WHERE adjustment_type = 'HANDLING' GROUP BY order_id
         ) a ON a.order_id = o.id
         WHERE o.order_date >= :since AND o.order_date < DATE_ADD(:until, INTERVAL 1 DAY)
         ORDER BY o.order_date"
    );
    $stmt->execute(['since' => $since, 'until' => $until]);
    $orders = $stmt->fetchAll();
    $rows = $calc->aggregate($orders);

    $fxFallback = array_sum(array_column($rows, 'fx_fallback_orders'));
    out(sprintf('window %s..%s: %d orders -> %d day/shop rows (fx fallback orders: %d)', $since, $until, count($orders), count($rows), $fxFallback));

    $columns = [
        'stat_date', 'shop', 'revenue', 'net_revenue', 'merchandise_revenue', 'shipping_fee_charged', 'handling_fee_charged',
        'revenue_native', 'revenue_native_in_base', 'cogs', 'cogs_units_matched', 'cogs_units_total', 'cogs_full_orders',
        'cogs_full_revenue', 'cogs_full_profit', 'gross_profit', 'ad_spend', 'payment_fees', 'payment_fee_missing_orders',
        'shipping_cost', 'shipping_cost_missing_orders', 'discount_total', 'contribution_profit', 'orders_count',
        'orders_completed', 'orders_open', 'orders_failed', 'failed_revenue', 'units_sold',
    ];

    if (!$opts['dry_run']) {
        $db->beginTransaction();
        $db->prepare('DELETE FROM daily_profit WHERE stat_date BETWEEN :since AND :until')->execute(['since' => $since, 'until' => $until]);
        $insert = $db->prepare(
            'INSERT INTO daily_profit (' . implode(', ', $columns) . ', currency, calculated_at, created_at, updated_at)
             VALUES (:' . implode(', :', $columns) . ', :currency, NOW(), NOW(), NOW())'
        );
        foreach ($rows as $row) {
            $params = ['currency' => (string) App::config('app.base_currency')];
            foreach ($columns as $c) {
                $v = $row[$c];
                $params[$c] = is_float($v) ? number_format($v, 2, '.', '') : $v;
            }
            $insert->execute($params);
        }
        $db->commit();
    }

    // Short per-month summary for the job log.
    $sum = [];
    foreach ($rows as $r) {
        $k = substr((string) $r['stat_date'], 0, 7) . ' ' . $r['shop'];
        $s = $sum[$k] ?? ['n' => 0, 'rev' => 0.0, 'cogs' => 0.0, 'um' => 0, 'ut' => 0, 'profit' => 0.0, 'failed' => 0];
        $s['n'] += $r['orders_count'];
        $s['rev'] += $r['revenue'];
        $s['cogs'] += $r['cogs'];
        $s['um'] += $r['cogs_units_matched'];
        $s['ut'] += $r['cogs_units_total'];
        $s['profit'] += $r['contribution_profit'];
        $s['failed'] += $r['orders_failed'];
        $sum[$k] = $s;
    }
    foreach ($sum as $k => $s) {
        out(sprintf('%s: %d orders (+%d failed), revenue %.2f EUR, COGS %.2f (units %d/%d), profit %.2f', $k, $s['n'], $s['failed'], $s['rev'], $s['cogs'], $s['um'], $s['ut'], $s['profit']));
    }

    if ($runId !== null) {
        $syncLogs->finish($runId, 'SUCCESS', count($rows), 0, null);
    }
    exit(0);
} catch (\Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    Logger::error('recalculate_profit', 'Run aborted', ['error' => $e->getMessage()]);
    out('FATAL: ' . $e->getMessage());
    if ($runId !== null) {
        $syncLogs->finish($runId, 'ERROR', 0, 0, $e->getMessage());
    }
    exit(1);
}
