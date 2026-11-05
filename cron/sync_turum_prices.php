<?php

declare(strict_types=1);

/**
 * Imports Turum's CURRENT per-variant price/stock into `turum_prices`, then
 * snapshots that price onto order_items that have no Turum cost yet.
 *
 * Source: the shared Turum full-list cache the dropship jobs on this
 * server already maintain (public_html/dropship/turum_list_cache.json +
 * turum_list_meta.json, refreshed by their own crons). This job only
 * READS that file - zero extra calls to Turum's 1-request-per-minute
 * /v1/products_full_list_new endpoint, and no Turum credentials needed in
 * this app. Override the path with TURUM_LIST_CACHE_PATH in .env.
 *
 * Pairing rule (same as the fleet's store/arres/arres.py and
 * agents/samu/scripts/profit_month.py): Unas SKU ==
 * UPPER(turum product sku + "-" + variant size, "." -> "-").
 * Unmatched SKUs simply stay without COGS - nothing is guessed.
 *
 * Usage: php cron/sync_turum_prices.php [--dry-run] [--max-age-hours=48]
 */

require __DIR__ . '/../app/Core/Autoloader.php';

use App\Core\App;
use App\Core\Database;
use App\Core\Logger;
use App\Repositories\SyncLogRepository;
use App\Services\TurumPriceMapper;

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('This script can only be run from the command line.');
}

\App\Core\Autoloader::register('App', __DIR__ . '/../app');
App::bootstrap(dirname(__DIR__));

$dryRun = in_array('--dry-run', $argv, true);
$maxAgeHours = 48;
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--max-age-hours=')) {
        $maxAgeHours = max(1, (int) substr($arg, strlen('--max-age-hours=')));
    }
}

$path = (string) (App::config('turum.list_cache_path') ?: '');
$metaPath = preg_replace('/_cache\.json$/', '_meta.json', $path) ?? '';

function out(string $m): void { fwrite(STDOUT, $m . PHP_EOL); }

$syncLogs = new SyncLogRepository();
$runId = $dryRun ? null : $syncLogs->start('sync_turum_prices');

try {
    if ($path === '' || !is_readable($path)) {
        throw new RuntimeException('Turum list cache not readable at the configured path.');
    }
    $meta = is_readable($metaPath) ? json_decode((string) file_get_contents($metaPath), true) : null;
    $fetchedTs = is_array($meta) && isset($meta['time']) ? (int) $meta['time'] : (int) filemtime($path);
    $ageHours = (time() - $fetchedTs) / 3600;
    out(sprintf('cache fetched %s (%.1f h ago)', date('Y-m-d H:i:s', $fetchedTs), $ageHours));
    if ($ageHours > $maxAgeHours) {
        throw new RuntimeException(sprintf('Turum list cache is %.1f h old (> %d h) - refusing to import stale prices.', $ageHours, $maxAgeHours));
    }

    $decoded = json_decode((string) file_get_contents($path), true);
    $products = is_array($decoded) && isset($decoded['data']) && is_array($decoded['data']) ? $decoded['data'] : $decoded;
    if (!is_array($products) || $products === []) {
        throw new RuntimeException('Turum list cache is empty or not a product list.');
    }

    $rows = (new TurumPriceMapper())->variantRows($products);
    out('products: ' . count($products) . ', priced variants: ' . count($rows));
    if (count($rows) < 100) {
        throw new RuntimeException('Suspiciously few Turum variants (' . count($rows) . ') - not importing.');
    }

    $db = Database::connection();
    $fetchedAt = date('Y-m-d H:i:s', $fetchedTs);
    if (!$dryRun) {
        $db->beginTransaction();
        $stmt = $db->prepare(
            'INSERT INTO turum_prices (turum_key, turum_sku, size, variant_id, price, currency, stock, source_fetched_at)
             VALUES (:k, :sku, :size, :vid, :price, :cur, :stock, :fetched)
             ON DUPLICATE KEY UPDATE turum_sku = VALUES(turum_sku), size = VALUES(size), variant_id = VALUES(variant_id),
                price = VALUES(price), currency = VALUES(currency), stock = VALUES(stock), source_fetched_at = VALUES(source_fetched_at)'
        );
        foreach ($rows as $r) {
            $stmt->execute([
                'k' => $r['turum_key'], 'sku' => $r['turum_sku'], 'size' => $r['size'], 'vid' => $r['variant_id'],
                'price' => $r['price'], 'cur' => 'EUR', 'stock' => $r['stock'], 'fetched' => $fetchedAt,
            ]);
        }
        $db->commit();
    }

    // Snapshot the current price onto order items that have none yet.
    // Never overwrites an existing snapshot (see migration 008).
    $captured = 0;
    if (!$dryRun) {
        $captured = $db->exec(
            'UPDATE order_items oi
             JOIN turum_prices tp ON tp.turum_key = UPPER(oi.sku)
             SET oi.turum_unit_cost = tp.price, oi.turum_cost_currency = tp.currency, oi.turum_cost_captured_at = NOW()
             WHERE oi.turum_unit_cost IS NULL'
        );
    }
    $coverage = $db->query(
        "SELECT COUNT(*) items, SUM(turum_unit_cost IS NOT NULL) matched FROM order_items oi
         JOIN orders o ON o.id = oi.order_id WHERE o.order_date >= '2026-10-01'"
    )->fetch();
    out('order items newly costed: ' . $captured . '; since 2026-10-01: ' . (int) $coverage['matched'] . ' / ' . (int) $coverage['items'] . ' items have a Turum cost');

    if ($runId !== null) {
        $syncLogs->finish($runId, 'SUCCESS', count($rows), 0, null);
    }
    exit(0);
} catch (\Throwable $e) {
    Logger::error('sync_turum_prices', 'Run aborted', ['error' => $e->getMessage()]);
    out('FATAL: ' . $e->getMessage());
    if ($runId !== null) {
        $syncLogs->finish($runId, 'ERROR', 0, 0, $e->getMessage());
    }
    exit(1);
}
