<?php

declare(strict_types=1);

/**
 * Syncs UNAS orders into the local `orders` table (HEADER FIELDS ONLY).
 *
 * Deliberately does NOT import order_items yet. The UNAS <Item> child
 * element names for quantity/unit price/discount are not yet confirmed
 * against a live response (see ARCHITECTURE.md "UNAS API integration
 * status"), and those columns are NOT NULL - inserting guessed values
 * would silently write wrong revenue numbers into a financial system.
 * Every order's full raw XML-derived array is stored in
 * orders.raw_payload (including its Items), so nothing is lost - once
 * the item field mapping is confirmed, a follow-up backfill can read it
 * from there without re-hitting the API.
 *
 * Idempotent: orders are upserted keyed on the UNAS <Id> (unas_order_id,
 * UNIQUE), so re-running this script (including overlapping date ranges)
 * never creates duplicates - see OrderRepository::upsertHeader().
 *
 * One malformed order record never aborts the batch: each record is
 * processed in its own try/catch; failures are counted and logged
 * (Logger + sync_logs.records_failed), and the loop continues.
 *
 * Incremental sync: DateStart is read from a `settings` watermark
 * (`unas_sync.orders_last_synced_to`) left by the previous successful
 * run, with a small overlap buffer so nothing right at the boundary is
 * missed (safe - re-syncing an already-synced order is just a no-op
 * update). First run (no watermark yet) defaults to the last 30 days;
 * override with --since=YYYY-MM-DD.
 *
 * UNCONFIRMED: the exact date format /getOrder expects for
 * DateStart/DateEnd. This script sends plain "Y-m-d" as the most common
 * REST/XML API convention; if UNAS rejects or ignores it, that will show
 * up directly in this run's console output and sync_logs.error_message -
 * check storage/logs/unas_sample_orders.xml or a fresh
 * scripts/test_unas_connection.php run to confirm, then fix the format
 * used below (search for "Y-m-d" in this file).
 *
 * Usage:
 *   php cron/sync_unas_orders.php                  Incremental sync (or last 30 days on first run)
 *   php cron/sync_unas_orders.php --since=2026-01-01 [--until=2026-08-17]
 *   php cron/sync_unas_orders.php --dry-run         Fetch and print what would happen, write nothing
 *   php cron/sync_unas_orders.php --limit-pages=5   Safety cap on how many pages to fetch (default 200)
 */

require __DIR__ . '/../app/Core/Autoloader.php';

use App\Core\App;
use App\Core\Logger;
use App\Repositories\OrderRepository;
use App\Repositories\SettingsRepository;
use App\Repositories\SyncLogRepository;
use App\Services\UnasApiService;

const JOB_NAME = 'sync_unas_orders';
const WATERMARK_KEY = 'unas_sync.orders_last_synced_to';
const PAGE_SIZE = 50;
const OVERLAP_BUFFER_HOURS = 1;

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('This script can only be run from the command line.');
}

\App\Core\Autoloader::register('App', __DIR__ . '/../app');
App::bootstrap(dirname(__DIR__));

function line(string $message): void
{
    fwrite(STDOUT, $message . PHP_EOL);
}

/**
 * @param array<int, string> $argv
 * @return array{dry_run: bool, since: ?string, until: ?string, limit_pages: int}
 */
function parseArgs(array $argv): array
{
    $options = ['dry_run' => false, 'since' => null, 'until' => null, 'limit_pages' => 200];

    foreach (array_slice($argv, 1) as $arg) {
        if ($arg === '--dry-run') {
            $options['dry_run'] = true;
        } elseif (str_starts_with($arg, '--since=')) {
            $options['since'] = substr($arg, strlen('--since='));
        } elseif (str_starts_with($arg, '--until=')) {
            $options['until'] = substr($arg, strlen('--until='));
        } elseif (str_starts_with($arg, '--limit-pages=')) {
            $options['limit_pages'] = max(1, (int) substr($arg, strlen('--limit-pages=')));
        }
    }

    return $options;
}

/**
 * UNAS's XML-to-array decoding collapses a single repeated child element
 * into an associative array (not a list) when there's only one of it -
 * a classic SimpleXML/json_encode quirk. This normalizes either shape
 * into a plain list so callers never have to special-case "one result".
 *
 * @return array<int, array<string, mixed>>
 */
function normalizeToList(mixed $value): array
{
    if ($value === null) {
        return [];
    }

    if (!is_array($value)) {
        return [];
    }

    // Sequential (list) array => already multiple records.
    if (array_is_list($value)) {
        return $value;
    }

    // Associative array => a single record.
    return [$value];
}

function parseUnasDate(mixed $value): ?string
{
    if (!is_string($value) || $value === '') {
        return null;
    }

    try {
        return (new DateTimeImmutable($value))->format('Y-m-d H:i:s');
    } catch (\Exception) {
        return null;
    }
}

/**
 * @param array<string, mixed> $order
 * @return array<string, mixed>
 */
function mapOrderHeader(array $order): array
{
    $unasOrderId = $order['Id'] ?? null;
    if (!is_scalar($unasOrderId) || (string) $unasOrderId === '') {
        throw new \RuntimeException('Order record has no <Id> - cannot dedupe/upsert it, skipping.');
    }

    $orderDate = parseUnasDate($order['Date'] ?? null);
    if ($orderDate === null) {
        throw new \RuntimeException('Order ' . $unasOrderId . ' has no parseable <Date>.');
    }

    $payment = is_array($order['Payment'] ?? null) ? $order['Payment'] : [];

    return [
        'unas_order_id' => (string) $unasOrderId,
        'unas_order_key' => isset($order['Key']) ? (string) $order['Key'] : null,
        'order_date' => $orderDate,
        'unas_date_mod' => parseUnasDate($order['DateMod'] ?? null),
        'currency' => isset($order['Currency']) && $order['Currency'] !== ''
            ? (string) $order['Currency']
            : (string) App::config('app.base_currency'),
        'status' => isset($order['Status']) ? (string) $order['Status'] : 'unknown',
        'status_id' => isset($order['StatusID']) ? (string) $order['StatusID'] : null,
        'status_type' => isset($order['StatusType']) ? (string) $order['StatusType'] : null,
        'payment_method' => isset($payment['Type']) ? (string) $payment['Type'] : null,
        'payment_status' => isset($payment['Status']) ? (string) $payment['Status'] : null,
        'payment_amount_paid' => isset($payment['Paid']) && is_numeric($payment['Paid']) ? (string) $payment['Paid'] : null,
        'grand_total' => isset($order['SumPriceGross']) && is_numeric($order['SumPriceGross']) ? (string) $order['SumPriceGross'] : '0',
        'raw_payload' => json_encode($order, JSON_UNESCAPED_UNICODE) ?: '{}',
    ];
}

$options = parseArgs($argv);
$settings = new SettingsRepository();
$syncLogs = new SyncLogRepository();
$orders = new OrderRepository();

line('=== sync_unas_orders ' . ($options['dry_run'] ? '(DRY RUN)' : '') . ' ===');

$activeRun = $syncLogs->findActiveRun(JOB_NAME);
if ($activeRun !== null) {
    line('Another run is already in progress (sync_logs id ' . $activeRun['id'] . ', started ' . $activeRun['started_at'] . '). Exiting.');
    exit(0);
}

$now = new DateTimeImmutable();
$dateEnd = $options['until'] ?? $now->format('Y-m-d');

if ($options['since'] !== null) {
    $dateStart = $options['since'];
} else {
    $watermark = $settings->get(WATERMARK_KEY);
    $dateStart = $watermark !== null
        ? (new DateTimeImmutable($watermark))->modify('-' . OVERLAP_BUFFER_HOURS . ' hours')->format('Y-m-d')
        : $now->modify('-30 days')->format('Y-m-d');
}

line('Date range: ' . $dateStart . ' .. ' . $dateEnd . ' (format unconfirmed - see file header comment)');

$runId = $options['dry_run'] ? null : $syncLogs->start(JOB_NAME);
$seen = 0;
$upserted = 0;
$failed = 0;
$page = 0;

try {
    $unas = new UnasApiService(
        (string) App::config('unas.api_key'),
        (string) App::config('unas.base_url'),
        (int) App::config('unas.rate_limit_per_minute')
    );

    do {
        $limitStart = $page * PAGE_SIZE;
        $response = $unas->getOrders([
            'DateStart' => $dateStart,
            'DateEnd' => $dateEnd,
            'LimitNum' => PAGE_SIZE,
            'LimitStart' => $limitStart,
        ]);

        $pageOrders = normalizeToList($response['Order'] ?? null);
        $pageCount = count($pageOrders);
        line('Page ' . ($page + 1) . ': ' . $pageCount . ' order(s).');

        foreach ($pageOrders as $rawOrder) {
            $seen++;
            try {
                $mapped = mapOrderHeader($rawOrder);

                if ($options['dry_run']) {
                    line('  [DRY RUN] would upsert order ' . $mapped['unas_order_id'] . ' (' . $mapped['status'] . ', ' . $mapped['grand_total'] . ' ' . $mapped['currency'] . ')');
                } else {
                    $orders->upsertHeader($mapped);
                }

                $upserted++;
            } catch (\Throwable $e) {
                $failed++;
                Logger::error('sync_unas_orders', 'Skipped one malformed order record', [
                    'unas_order_id' => $rawOrder['Id'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ]);
                line('  FAILED to map/store one order (see storage/logs/sync_unas_orders-*.log): ' . $e->getMessage());
            }
        }

        $page++;
    } while ($pageCount === PAGE_SIZE && $page < $options['limit_pages']);

    if (!$options['dry_run']) {
        $settings->set(WATERMARK_KEY, $dateEnd, 'sync', 'Last DateEnd successfully used by cron/sync_unas_orders.php.');
        $syncLogs->finish($runId, $failed > 0 && $upserted === 0 ? 'ERROR' : 'SUCCESS', $upserted, $failed, null);
    }

    line('=== Done: ' . $seen . ' order(s) seen, ' . $upserted . ' upserted, ' . $failed . ' failed, ' . $page . ' page(s). ===');
    line('NOTE: order line items were NOT imported (quantity/price field mapping pending) - see file header comment.');
    exit($failed > 0 && $upserted === 0 ? 1 : 0);
} catch (\Throwable $e) {
    Logger::error('sync_unas_orders', 'Run aborted', ['error' => $e->getMessage()]);
    line('FATAL: ' . $e->getMessage());

    if (!$options['dry_run'] && $runId !== null) {
        $syncLogs->finish($runId, 'ERROR', $upserted, $failed, $e->getMessage());
    }

    exit(1);
}
