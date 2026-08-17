<?php

declare(strict_types=1);

/**
 * Syncs UNAS orders into `orders`, merchandise line items into
 * `order_items`, and synthetic financial rows (shipping/discount/gift/
 * unknown) into `order_adjustments`.
 *
 * UNAS mixes real merchandise with synthetic financial rows in the same
 * <Order><Items><Item> list - confirmed live examples: a normal
 * merchandise row (<Sku>sneakershieldL</Sku><Quantity>1</Quantity>
 * <PriceGross>4</PriceGross>), and synthetic rows keyed by fixed SKUs
 * like "shipping-cost" (positive), "discount-percent" and "gift" (both
 * negative). UnasOrderItemClassifier decides which is which; only
 * MERCHANDISE rows become order_items (and only those can ever get
 * FIFO/COGS later) - everything else goes to order_adjustments. See
 * that class's docblock and ARCHITECTURE.md "Order line item financial
 * model" for the full reasoning, including what's still unconfirmed
 * (per-unit vs line-total pricing, shipping/customer sub-fields).
 *
 * This script is thin orchestration + persistence only - the actual
 * field mapping (UnasOrderMapper) and reconciliation math
 * (OrderReconciler) are separate, dependency-free Services so they can
 * be unit tested without a database or a live API call - see tests/.
 *
 * Reconciliation: for every order, SUM(all Item PriceGross * Quantity) -
 * merchandise AND synthetic rows alike - is compared against
 * <SumPriceGross> (orders.grand_total). A match within
 * RECONCILIATION_TOLERANCE sets orders.is_reconciled = 1; a mismatch
 * sets it to 0 and logs the order id/key + difference. Never "corrects"
 * either number - a mismatch is a signal to investigate, not something
 * this job silently papers over.
 *
 * Idempotent: orders/order_items/order_adjustments are all upserted on
 * unique keys (unas_order_id; (order_id, unas_item_id) for both item
 * tables) - re-running this script (including overlapping date ranges)
 * never creates duplicates. KNOWN LIMITATION: an item UNAS stops
 * returning for an order (e.g. a manual edit) is not pruned locally -
 * see OrderRepository's docblock.
 *
 * One malformed order OR item never aborts the batch: both are
 * processed in their own try/catch; failures are counted and logged,
 * and processing continues.
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
 * up directly in this run's console output and sync_logs.error_message.
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
use App\Repositories\OrderAdjustmentRepository;
use App\Repositories\OrderRepository;
use App\Repositories\ProductRepository;
use App\Repositories\SettingsRepository;
use App\Repositories\SyncLogRepository;
use App\Services\OrderReconciler;
use App\Services\UnasApiService;
use App\Services\UnasOrderItemClassifier;
use App\Services\UnasOrderMapper;

const JOB_NAME = 'sync_unas_orders';
const WATERMARK_KEY = 'unas_sync.orders_last_synced_to';
const PAGE_SIZE = 50;
const OVERLAP_BUFFER_HOURS = 1;
/** Currency-unit tolerance for the SumPriceGross reconciliation check. */
const RECONCILIATION_TOLERANCE = 0.02;

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
 * Classifies, persists (unless dry-run) and reconciles every Item on one
 * order. Returns per-order stats folded into the run's overall summary
 * by the caller.
 *
 * @param array<string, mixed> $order
 * @return array{merchandise: int, adjustments: int, item_failures: int, is_reconciled: ?bool, difference: ?string}
 */
function processOrderItems(
    array $order,
    ?int $localOrderId,
    string $grandTotal,
    string $currency,
    UnasOrderMapper $mapper,
    UnasOrderItemClassifier $classifier,
    OrderReconciler $reconciler,
    ProductRepository $products,
    OrderRepository $orders,
    OrderAdjustmentRepository $adjustments,
    bool $dryRun
): array {
    $items = $mapper->normalizeToList($order['Items']['Item'] ?? null);

    $merchandiseCount = 0;
    $adjustmentCount = 0;
    $itemFailures = 0;

    foreach ($items as $rawItem) {
        try {
            $classification = $classifier->classify($rawItem);

            if ($classification === UnasOrderItemClassifier::MERCHANDISE) {
                $itemData = $mapper->mapMerchandiseItem($rawItem);
                $itemData['product_variant_id'] = $products->findVariantIdBySku($itemData['sku']);
                $itemData['currency'] = $currency;

                if ($dryRun) {
                    line('    [DRY RUN] would upsert item SKU ' . $itemData['sku'] . ' qty ' . $itemData['quantity'] . ' @ ' . $itemData['unit_price_gross'] . ' ' . $currency);
                } elseif ($localOrderId !== null) {
                    $orders->upsertItem($localOrderId, $itemData);
                }

                $merchandiseCount++;
            } else {
                $adjustmentData = $mapper->mapAdjustmentItem($rawItem, $classification);
                $adjustmentData['currency'] = $currency;

                if ($dryRun) {
                    line('    [DRY RUN] would upsert adjustment (' . $adjustmentData['adjustment_type'] . ') SKU ' . $adjustmentData['sku'] . ' = ' . ($adjustmentData['price_gross'] ?? 'n/a') . ' ' . $currency);
                } elseif ($localOrderId !== null) {
                    $adjustments->upsert($localOrderId, $adjustmentData);
                }

                $adjustmentCount++;
            }
        } catch (\Throwable $e) {
            $itemFailures++;
            Logger::error('sync_unas_orders', 'Skipped one malformed order item', [
                'unas_order_item_sku' => $rawItem['Sku'] ?? 'unknown',
                'error' => $e->getMessage(),
            ]);
        }
    }

    $result = $reconciler->reconcile($items, $grandTotal, RECONCILIATION_TOLERANCE);

    if (!$dryRun && $localOrderId !== null && $items !== []) {
        $orders->updateAggregates(
            $localOrderId,
            number_format($result['merchandise_gross'], 4, '.', ''),
            number_format($result['shipping_gross'], 4, '.', ''),
            number_format($result['discount_gross'], 4, '.', '')
        );
        $orders->updateReconciliation($localOrderId, (bool) $result['is_reconciled'], number_format($result['difference'], 4, '.', ''));
    }

    return [
        'merchandise' => $merchandiseCount,
        'adjustments' => $adjustmentCount,
        'item_failures' => $itemFailures,
        'is_reconciled' => $result['is_reconciled'],
        'difference' => $result['difference'] !== null ? number_format($result['difference'], 4, '.', '') : null,
    ];
}

$options = parseArgs($argv);
$settings = new SettingsRepository();
$syncLogs = new SyncLogRepository();
$orders = new OrderRepository();
$adjustments = new OrderAdjustmentRepository();
$products = new ProductRepository();
$mapper = new UnasOrderMapper();
$classifier = new UnasOrderItemClassifier();
$reconciler = new OrderReconciler($classifier);

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
$merchandiseTotal = 0;
$adjustmentsTotal = 0;
$itemFailuresTotal = 0;
$reconciledTotal = 0;
$unreconciledTotal = 0;

try {
    $unas = new UnasApiService(
        (string) App::config('unas.api_key'),
        (string) App::config('unas.base_url'),
        (int) App::config('unas.rate_limit_per_minute')
    );
    $baseCurrency = (string) App::config('app.base_currency');

    do {
        $limitStart = $page * PAGE_SIZE;
        $response = $unas->getOrders([
            'DateStart' => $dateStart,
            'DateEnd' => $dateEnd,
            'LimitNum' => PAGE_SIZE,
            'LimitStart' => $limitStart,
        ]);

        $pageOrders = $mapper->normalizeToList($response['Order'] ?? null);
        $pageCount = count($pageOrders);
        line('Page ' . ($page + 1) . ': ' . $pageCount . ' order(s).');

        foreach ($pageOrders as $rawOrder) {
            $seen++;
            try {
                $mapped = $mapper->mapOrderHeader($rawOrder, $baseCurrency);
                $localOrderId = null;

                if ($options['dry_run']) {
                    line('  [DRY RUN] would upsert order ' . $mapped['unas_order_id'] . ' (' . $mapped['status'] . ', ' . $mapped['grand_total'] . ' ' . $mapped['currency'] . ')');
                } else {
                    $localOrderId = $orders->upsertHeader($mapped);
                }

                $itemStats = processOrderItems(
                    $rawOrder,
                    $localOrderId,
                    $mapped['grand_total'],
                    $mapped['currency'],
                    $mapper,
                    $classifier,
                    $reconciler,
                    $products,
                    $orders,
                    $adjustments,
                    $options['dry_run']
                );

                $upserted++;
                $merchandiseTotal += $itemStats['merchandise'];
                $adjustmentsTotal += $itemStats['adjustments'];
                $itemFailuresTotal += $itemStats['item_failures'];

                if ($itemStats['is_reconciled'] === true) {
                    $reconciledTotal++;
                } elseif ($itemStats['is_reconciled'] === false) {
                    $unreconciledTotal++;
                    line('  RECONCILIATION MISMATCH order ' . $mapped['unas_order_id'] . ' (key ' . ($mapped['unas_order_key'] ?? 'n/a') . '): difference ' . $itemStats['difference'] . ' ' . $mapped['currency']);
                    Logger::warning('sync_unas_orders', 'Order did not reconcile against SumPriceGross', [
                        'unas_order_id' => $mapped['unas_order_id'],
                        'unas_order_key' => $mapped['unas_order_key'],
                        'difference' => $itemStats['difference'],
                    ]);
                }
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

    line('=== Done: ' . $seen . ' order(s) seen, ' . $upserted . ' upserted, ' . $failed . ' order failure(s), ' . $page . ' page(s). ===');
    line('Items: ' . $merchandiseTotal . ' merchandise, ' . $adjustmentsTotal . ' adjustment(s) (shipping/discount/gift/unknown), ' . $itemFailuresTotal . ' item failure(s).');
    line('Reconciliation: ' . $reconciledTotal . ' order(s) matched SumPriceGross within ' . RECONCILIATION_TOLERANCE . ', ' . $unreconciledTotal . ' did not (see warnings above / storage/logs/sync_unas_orders-*.log).');
    exit($failed > 0 && $upserted === 0 ? 1 : 0);
} catch (\Throwable $e) {
    Logger::error('sync_unas_orders', 'Run aborted', ['error' => $e->getMessage()]);
    line('FATAL: ' . $e->getMessage());

    if (!$options['dry_run'] && $runId !== null) {
        $syncLogs->finish($runId, 'ERROR', $upserted, $failed, $e->getMessage());
    }

    exit(1);
}
