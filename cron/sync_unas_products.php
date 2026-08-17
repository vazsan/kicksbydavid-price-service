<?php

declare(strict_types=1);

/**
 * Syncs UNAS products into `products` + `product_variants`.
 *
 * Per ARCHITECTURE.md, this UNAS account's /getProduct response returns
 * one <Product> per sellable SKU directly (confirmed live sample: SKU
 * "FZ4625-100-11" was itself a full top-level <Product> with an empty
 * <Variants> node - size lived under <Params> instead). With no
 * confirmed field to group sibling sizes under one real parent, each
 * synced SKU gets its own 1:1 "shadow" `products` parent row - see
 * ProductRepository's docblock for the reasoning and how to correct this
 * later if a real grouping field turns out to exist.
 *
 * Idempotent: products are upserted keyed on UNAS <Id> (unas_product_id,
 * UNIQUE), variants keyed on <Sku> (UNIQUE) - re-running this script
 * never creates duplicates.
 *
 * One malformed product record never aborts the batch - same per-record
 * try/catch pattern as cron/sync_unas_orders.php.
 *
 * No incremental sync here: /getProduct's confirmed request filters are
 * StatusBase/LimitNum/LimitStart/ContentType - there is no confirmed
 * "modified since" filter (CreateTime/LastModTime are documented as
 * RESPONSE fields, not confirmed request filters), so this does a full
 * paginated re-pull of the catalog every run. That's safe (idempotent
 * upsert) but not cheap - if UNAS turns out to support an incremental
 * filter, add it here and to ProductRepository once confirmed.
 *
 * Fields intentionally NOT mapped into typed columns yet (raw XML is
 * still preserved in raw_prices/raw_params/raw_statuses so nothing is
 * lost): which <Param> entry represents size/color (raw_params only, see
 * ASSUMPTIONS.md), stock (no confirmed stock field seen in the sample -
 * current_stock_cached is left NULL), category (Categories block shape
 * unconfirmed).
 *
 * Usage:
 *   php cron/sync_unas_products.php                       Full re-sync from the start of the catalog
 *   php cron/sync_unas_products.php --dry-run              Fetch and print only, write nothing
 *   php cron/sync_unas_products.php --status-base=live      Pass-through StatusBase filter (unconfirmed accepted values)
 *   php cron/sync_unas_products.php --limit-pages=5          Safety cap on pages fetched THIS RUN (default 200)
 *   php cron/sync_unas_products.php --start-page=200          Resume after 200 already-completed pages (= --start-offset=10000 at PAGE_SIZE=50)
 *   php cron/sync_unas_products.php --start-offset=10000        Resume from an exact UNAS LimitStart value
 *
 * --start-page/--start-offset exist because the safety page cap can be
 * reached before the real end of the catalog (confirmed production case:
 * 200 pages x 50 = 10,000 records seen, and page 200 was still full) -
 * see UnasProductSyncPagination's docblock for the exact resume math.
 */

require __DIR__ . '/../app/Core/Autoloader.php';

use App\Core\App;
use App\Core\Logger;
use App\Repositories\ProductRepository;
use App\Repositories\SyncLogRepository;
use App\Services\UnasApiService;
use App\Services\UnasProductPriceMapper;
use App\Services\UnasProductSyncPagination;

const JOB_NAME = 'sync_unas_products';
const PAGE_SIZE = 50;
/** How many SKU | list_price | current_price rows the dry-run prints, so a full-catalog run doesn't flood the console. */
const DRY_RUN_PRICE_SAMPLE_LIMIT = 10;
/** How many duplicate SKU identifiers to keep/log/print - not a secret/PII, just capped so a heavily-duplicated catalog doesn't spam the log. */
const DUPLICATE_SKU_SAMPLE_LIMIT = 50;

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
 * @return array{dry_run: bool, status_base: ?string, limit_pages: int, start_page: ?int, start_offset: ?int}
 */
function parseArgs(array $argv): array
{
    $options = [
        'dry_run' => false,
        'status_base' => null,
        'limit_pages' => 200,
        'start_page' => null,
        'start_offset' => null,
    ];

    foreach (array_slice($argv, 1) as $arg) {
        if ($arg === '--dry-run') {
            $options['dry_run'] = true;
        } elseif (str_starts_with($arg, '--status-base=')) {
            $options['status_base'] = substr($arg, strlen('--status-base='));
        } elseif (str_starts_with($arg, '--limit-pages=')) {
            $options['limit_pages'] = max(1, (int) substr($arg, strlen('--limit-pages=')));
        } elseif (str_starts_with($arg, '--start-page=')) {
            $options['start_page'] = (int) substr($arg, strlen('--start-page='));
        } elseif (str_starts_with($arg, '--start-offset=')) {
            $options['start_offset'] = (int) substr($arg, strlen('--start-offset='));
        }
    }

    return $options;
}

/** Same XML-to-array single-vs-list quirk as in cron/sync_unas_orders.php. */
function normalizeToList(mixed $value): array
{
    if ($value === null || !is_array($value)) {
        return [];
    }

    return array_is_list($value) ? $value : [$value];
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
 * @param array<string, mixed> $product
 * @return array{product: array<string, mixed>, variant: array<string, mixed>}
 */
function mapProduct(array $product, UnasProductPriceMapper $priceMapper): array
{
    $unasId = $product['Id'] ?? null;
    $sku = $product['Sku'] ?? null;

    if (!is_scalar($unasId) || (string) $unasId === '') {
        throw new \RuntimeException('Product record has no <Id> - cannot upsert it, skipping.');
    }
    if (!is_scalar($sku) || (string) $sku === '') {
        throw new \RuntimeException('Product ' . $unasId . ' has no <Sku> - cannot upsert it, skipping.');
    }

    $price = $priceMapper->extractPrice($product);

    return [
        'product' => [
            'unas_product_id' => (string) $unasId,
            'name' => isset($product['Name']) ? (string) $product['Name'] : (string) $sku,
        ],
        'variant' => [
            'sku' => (string) $sku,
            'unas_variant_id' => (string) $unasId,
            'list_price' => $price['list_price'],
            'current_price' => $price['current_price'],
            'raw_prices' => isset($product['Prices']) ? (json_encode($product['Prices'], JSON_UNESCAPED_UNICODE) ?: null) : null,
            'raw_params' => isset($product['Params']) ? (json_encode($product['Params'], JSON_UNESCAPED_UNICODE) ?: null) : null,
            'raw_statuses' => isset($product['Statuses']) ? (json_encode($product['Statuses'], JSON_UNESCAPED_UNICODE) ?: null) : null,
            'currency' => (string) App::config('app.base_currency'),
            'unas_state' => isset($product['State']) ? (string) $product['State'] : null,
            'unas_created_at' => parseUnasDate($product['CreateTime'] ?? null),
            'unas_modified_at' => parseUnasDate($product['LastModTime'] ?? null),
            'url' => isset($product['Url']) ? (string) $product['Url'] : null,
        ],
    ];
}

$options = parseArgs($argv);
$syncLogs = new SyncLogRepository();
$products = new ProductRepository();
$priceMapper = new UnasProductPriceMapper();
$pagination = new UnasProductSyncPagination();

line('=== sync_unas_products ' . ($options['dry_run'] ? '(DRY RUN)' : '') . ' ===');

$activeRun = $syncLogs->findActiveRun(JOB_NAME);
if ($activeRun !== null) {
    line('Another run is already in progress (sync_logs id ' . $activeRun['id'] . ', started ' . $activeRun['started_at'] . '). Exiting.');
    exit(0);
}

$startOffset = $pagination->resolveStartOffset($options['start_page'], $options['start_offset'], PAGE_SIZE);
if ($startOffset > 0) {
    line('Resuming from LimitStart=' . $startOffset . ' (logical page ' . $pagination->logicalPageNumber($startOffset, PAGE_SIZE) . ').');
}

$runId = $options['dry_run'] ? null : $syncLogs->start(JOB_NAME);
$seen = 0;
$upserted = 0;
$failed = 0;
$localPageIndex = 0;
$priceSamplesShown = 0;
$seenSkus = [];
$duplicateCount = 0;
$duplicateSkuSample = [];

try {
    $unas = new UnasApiService(
        (string) App::config('unas.api_key'),
        (string) App::config('unas.base_url'),
        (int) App::config('unas.rate_limit_per_minute')
    );

    do {
        $limitStart = $pagination->limitStartForLocalPage($startOffset, $localPageIndex, PAGE_SIZE);
        $logicalPage = $pagination->logicalPageNumber($limitStart, PAGE_SIZE);

        $filters = ['LimitNum' => PAGE_SIZE, 'LimitStart' => $limitStart];
        if ($options['status_base'] !== null) {
            $filters['StatusBase'] = $options['status_base'];
        }

        $response = $unas->getProducts($filters);

        $pageProducts = normalizeToList($response['Product'] ?? null);
        $pageCount = count($pageProducts);
        line('Page ' . $logicalPage . ' (LimitStart=' . $limitStart . '): ' . $pageCount . ' product(s).');

        foreach ($pageProducts as $rawProduct) {
            $seen++;
            try {
                $mapped = mapProduct($rawProduct, $priceMapper);
                $sku = $mapped['variant']['sku'];

                if (isset($seenSkus[$sku])) {
                    $duplicateCount++;
                    if (count($duplicateSkuSample) < DUPLICATE_SKU_SAMPLE_LIMIT) {
                        $duplicateSkuSample[] = $sku;
                    }
                } else {
                    $seenSkus[$sku] = true;
                }

                if ($options['dry_run']) {
                    if ($priceSamplesShown < DRY_RUN_PRICE_SAMPLE_LIMIT) {
                        if ($priceSamplesShown === 0) {
                            line('  SKU | list_price | current_price');
                        }
                        line('  ' . $sku . ' | ' . ($mapped['variant']['list_price'] ?? 'null') . ' | ' . ($mapped['variant']['current_price'] ?? 'null'));
                        $priceSamplesShown++;
                    }
                } else {
                    $products->upsertProductAndVariant($mapped['product'], $mapped['variant']);
                }

                $upserted++;
            } catch (\Throwable $e) {
                $failed++;
                Logger::error('sync_unas_products', 'Skipped one malformed product record', [
                    'unas_id' => $rawProduct['Id'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ]);
                line('  FAILED to map/store one product (see storage/logs/sync_unas_products-*.log): ' . $e->getMessage());
            }
        }

        $localPageIndex++;
    } while ($pageCount === PAGE_SIZE && $localPageIndex < $options['limit_pages']);

    // If the loop only stopped because the safety cap was hit, the last
    // fetched page was still full - i.e. there was no natural end. A
    // short/empty final page (the normal end-of-catalog case) never
    // reaches here since $pageCount would be < PAGE_SIZE.
    $safetyLimitReached = $pageCount === PAGE_SIZE;
    if ($safetyLimitReached) {
        $nextOffset = $pagination->limitStartForLocalPage($startOffset, $localPageIndex, PAGE_SIZE);
        line('WARNING: Safety page limit reached; catalog may contain additional products.');
        line('  Continue with: php cron/sync_unas_products.php --start-offset=' . $nextOffset . ($options['dry_run'] ? ' --dry-run' : ''));
    }

    if (!$options['dry_run']) {
        $syncLogs->finish($runId, $failed > 0 && $upserted === 0 ? 'ERROR' : 'SUCCESS', $upserted, $failed, null);
    }

    line('=== Done: ' . $seen . ' product(s) seen, ' . $upserted . ' upserted, ' . $failed . ' failed, ' . $localPageIndex . ' page(s) fetched this run. ===');
    line('Duplicate SKUs seen this run: ' . $duplicateCount . ($duplicateSkuSample !== [] ? ' (sample: ' . implode(', ', $duplicateSkuSample) . ($duplicateCount > count($duplicateSkuSample) ? ', ...' : '') . ')' : '') . '.');
    if ($duplicateCount > 0) {
        Logger::warning('sync_unas_products', 'Duplicate SKUs encountered during sync', [
            'duplicate_count' => $duplicateCount,
            'sample_skus' => $duplicateSkuSample,
        ]);
    }
    line('NOTE: stock/category were NOT imported (field mapping pending) - see file header comment.');
    exit($failed > 0 && $upserted === 0 ? 1 : 0);
} catch (\Throwable $e) {
    Logger::error('sync_unas_products', 'Run aborted', ['error' => $e->getMessage()]);
    line('FATAL: ' . $e->getMessage());

    if (!$options['dry_run'] && $runId !== null) {
        $syncLogs->finish($runId, 'ERROR', $upserted, $failed, $e->getMessage());
    }

    exit(1);
}
