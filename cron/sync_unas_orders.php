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
 * <SumPriceGross> (orders.grand_total), within a currency-specific
 * tolerance (OrderReconciler::TOLERANCE_MAP - confirmed from a real
 * 14-order production dry-run: EUR 0.02, HUF 1.00, to absorb HUF's
 * observed percentage-discount rounding noise without hiding a real
 * mismatch). A match sets orders.is_reconciled = 1; a mismatch sets it
 * to 0 and logs the order id/key + currency + difference + tolerance
 * used. Never "corrects" either number - a mismatch is a signal to
 * investigate, not something this job silently papers over.
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
 * Window: by default every run re-fetches a ROLLING window of the last
 * ROLLING_DAYS days (not just "since the last run"), because an order's
 * status keeps changing for days after it is placed (in transit ->
 * closed / failed) and the profit numbers depend on it. Re-syncing an
 * already-synced order is a no-op update. Override with --since/--until.
 *
 * Fetching (2026-11-05 rewrite): /getOrder is called with DateStart/
 * DateEnd in UNAS's "Y.m.d" format and LimitNum=500, one window of at
 * most --window-days days per call. This matches the fleet's confirmed
 * read-only usage (agents/samu orders_window_*.py): UNAS returns at most
 * 500 orders per call and has NO working LimitStart paging for orders,
 * so the previous LimitStart loop could re-read the same page up to
 * 200 times. A window that comes back with 500 orders is split in half
 * (down to a single day). Calls are strictly serial with --sleep seconds
 * between them: the UNAS rate limit is shared with the dropship jobs.
 *
 * Usage:
 *   php cron/sync_unas_orders.php                  Rolling window (last 14 days)
 *   php cron/sync_unas_orders.php --since=2026-10-01 [--until=2026-11-05]
 *   php cron/sync_unas_orders.php --window-days=7 --sleep=15
 *   php cron/sync_unas_orders.php --dry-run         Fetch and print what would happen, write nothing
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
const UNAS_MAX_PER_CALL = 500;
const ROLLING_DAYS = 14;
// Reconciliation tolerance is currency-specific - see OrderReconciler::TOLERANCE_MAP.

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
 * @return array{dry_run: bool, since: ?string, until: ?string, window_days: int, sleep: int}
 */
function parseArgs(array $argv): array
{
    $options = ['dry_run' => false, 'since' => null, 'until' => null, 'window_days' => 7, 'sleep' => 10];

    foreach (array_slice($argv, 1) as $arg) {
        if ($arg === '--dry-run') {
            $options['dry_run'] = true;
        } elseif (str_starts_with($arg, '--since=')) {
            $options['since'] = substr($arg, strlen('--since='));
        } elseif (str_starts_with($arg, '--until=')) {
            $options['until'] = substr($arg, strlen('--until='));
        } elseif (str_starts_with($arg, '--window-days=')) {
            $options['window_days'] = max(1, min(31, (int) substr($arg, strlen('--window-days='))));
        } elseif (str_starts_with($arg, '--sleep=')) {
            $options['sleep'] = max(0, min(120, (int) substr($arg, strlen('--sleep='))));
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

    $result = $reconciler->reconcile($items, $grandTotal, $currency);

    if ($items !== [] && !array_key_exists($currency, OrderReconciler::TOLERANCE_MAP)) {
        Logger::warning('sync_unas_orders', 'Using default reconciliation tolerance for an unrecognized currency', [
            'currency' => $currency,
            'tolerance' => $result['tolerance'],
        ]);
    }

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
        'tolerance' => $result['tolerance'],
        'currency' => $currency,
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

$now = new DateTimeImmutable('today');
$validDate = static function (?string $v): ?DateTimeImmutable {
    if ($v === null) {
        return null;
    }
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $v);
    return ($d && $d->format('Y-m-d') === $v) ? $d : null;
};
$until = $validDate($options['until']) ?? $now;
$since = $validDate($options['since']) ?? $until->modify('-' . (ROLLING_DAYS - 1) . ' days');
if ($since > $until) {
    line('FATAL: --since is after --until.');
    exit(1);
}
$dateStart = $since->format('Y-m-d');
$dateEnd = $until->format('Y-m-d');

line('Date range: ' . $dateStart . ' .. ' . $dateEnd . ' (windows of ' . $options['window_days'] . ' day(s), ' . $options['sleep'] . ' s between calls)');

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
$seenIds = [];

try {
    $unas = new UnasApiService(
        (string) App::config('unas.api_key'),
        (string) App::config('unas.base_url'),
        (int) App::config('unas.rate_limit_per_minute')
    );
    $baseCurrency = (string) App::config('app.base_currency');

    // Work queue of [from, to] windows; a truncated (500) window is split.
    $queue = [];
    for ($d = $since; $d <= $until; $d = $d->modify('+' . $options['window_days'] . ' days')) {
        $end = $d->modify('+' . ($options['window_days'] - 1) . ' days');
        $queue[] = [$d, $end > $until ? $until : $end];
    }

    while ($queue !== []) {
        [$wFrom, $wTo] = array_shift($queue);
        if ($page > 0 && $options['sleep'] > 0) {
            sleep($options['sleep']);
        }
        $page++;
        $response = $unas->getOrders([
            'DateStart' => $wFrom->format('Y.m.d'),
            'DateEnd' => $wTo->format('Y.m.d'),
            'LimitNum' => UNAS_MAX_PER_CALL,
        ]);

        $pageOrders = $mapper->normalizeToList($response['Order'] ?? null);
        $pageCount = count($pageOrders);
        line('Window ' . $wFrom->format('Y-m-d') . '..' . $wTo->format('Y-m-d') . ': ' . $pageCount . ' order(s).');

        if ($pageCount >= UNAS_MAX_PER_CALL) {
            if ($wFrom == $wTo) {
                throw new RuntimeException('A single day returned ' . $pageCount . ' orders (UNAS cap) - cannot split further, stopping.');
            }
            $days = (int) $wFrom->diff($wTo)->days;
            $mid = $wFrom->modify('+' . intdiv($days, 2) . ' days');
            array_unshift($queue, [$wFrom, $mid], [$mid->modify('+1 day'), $wTo]);
            line('  window hit the UNAS cap, splitting it.');
            continue;
        }

        foreach ($pageOrders as $rawOrder) {
            $rawId = is_scalar($rawOrder['Id'] ?? null) ? (string) $rawOrder['Id'] : null;
            if ($rawId !== null && isset($seenIds[$rawId])) {
                continue; // Same order returned by two windows - process once.
            }
            if ($rawId !== null) {
                $seenIds[$rawId] = true;
            }
            $seen++;
            try {
                $mapped = $mapper->mapOrderHeader($rawOrder, $baseCurrency);
                $localOrderId = null;

                if ($options['dry_run']) {
                    line('  [DRY RUN] would upsert order ' . $mapped['unas_order_id'] . ' (' . ($mapped['shop'] ?? '?') . ', ' . $mapped['status'] . ', ' . $mapped['grand_total'] . ' ' . $mapped['currency'] . ', fx ' . ($mapped['unas_exchange_value'] ?? '-') . ')');
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
                    line('  RECONCILIATION MISMATCH order ' . $mapped['unas_order_id'] . ' (key ' . ($mapped['unas_order_key'] ?? 'n/a') . '): difference ' . $itemStats['difference'] . ' ' . $itemStats['currency'] . ' (tolerance ' . $itemStats['tolerance'] . ' ' . $itemStats['currency'] . ')');
                    Logger::warning('sync_unas_orders', 'Order did not reconcile against SumPriceGross', [
                        'unas_order_id' => $mapped['unas_order_id'],
                        'unas_order_key' => $mapped['unas_order_key'],
                        'currency' => $itemStats['currency'],
                        'difference' => $itemStats['difference'],
                        'tolerance' => $itemStats['tolerance'],
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
    }

    if (!$options['dry_run']) {
        $settings->set(WATERMARK_KEY, $dateEnd, 'sync', 'Last DateEnd successfully used by cron/sync_unas_orders.php.');
        $syncLogs->finish($runId, $failed > 0 && $upserted === 0 ? 'ERROR' : 'SUCCESS', $upserted, $failed, null);
    }

    line('=== Done: ' . $seen . ' order(s) seen, ' . $upserted . ' upserted, ' . $failed . ' order failure(s), ' . $page . ' API call(s). ===');
    line('Items: ' . $merchandiseTotal . ' merchandise, ' . $adjustmentsTotal . ' adjustment(s) (shipping/discount/handling/gift/unknown), ' . $itemFailuresTotal . ' item failure(s).');
    line('Reconciliation: ' . $reconciledTotal . ' order(s) matched SumPriceGross within their currency-specific tolerance (see OrderReconciler::TOLERANCE_MAP), ' . $unreconciledTotal . ' did not (see warnings above / storage/logs/sync_unas_orders-*.log).');
    exit($failed > 0 && $upserted === 0 ? 1 : 0);
} catch (\Throwable $e) {
    Logger::error('sync_unas_orders', 'Run aborted', ['error' => $e->getMessage()]);
    line('FATAL: ' . $e->getMessage());

    if (!$options['dry_run'] && $runId !== null) {
        $syncLogs->finish($runId, 'ERROR', $upserted, $failed, $e->getMessage());
    }

    exit(1);
}
