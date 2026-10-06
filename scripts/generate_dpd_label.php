<?php

declare(strict_types=1);

/**
 * Generates a DPD Polska shipping label (A4 PDF) for a single UNAS order.
 *
 * Flow:
 *   1. Fetch the order fresh from UNAS (/getOrder?OrderID=...) so the
 *      recipient address is current - not whatever the analytics import
 *      happened to store.
 *   2. Map it to the DPD openUMLFeV3 structure (DpdOrderMapper), with the
 *      sender taken from the DPD_SENDER_* config.
 *   3. generatePackagesNumbersV4 -> waybill number(s) + sessionId.
 *   4. generateSpedLabelsV4 -> base64 PDF, saved under storage/labels/.
 *   5. Record the shipment in dpd_shipments (so it is not generated twice).
 *
 * Usage (run ON THE SERVER with real DPD + UNAS credentials in .env):
 *   php scripts/generate_dpd_label.php <UNAS_ORDER_ID>
 *   php scripts/generate_dpd_label.php <UNAS_ORDER_ID> --dry-run
 *   php scripts/generate_dpd_label.php <UNAS_ORDER_ID> --force
 *
 *   --dry-run  Fetch + map + print the exact DPD payload (receiver,
 *              sender, parcel, COD) WITHOUT calling DPD or saving anything.
 *              Use this to verify the address mapping on a real order
 *              before the first live shipment.
 *   --force    Generate even if a label already exists for this order
 *              (this registers a SECOND, duplicate waybill - use with care).
 */

require __DIR__ . '/../app/Core/Autoloader.php';

use App\Core\App;
use App\Repositories\DpdShipmentRepository;
use App\Services\DpdApiService;
use App\Services\DpdOrderMapper;
use App\Services\UnasApiService;

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

function fail(string $message): never
{
    fwrite(STDERR, $message . PHP_EOL);
    exit(1);
}

// --- args -------------------------------------------------------------
$orderId = null;
$dryRun = false;
$force = false;
foreach (array_slice($argv, 1) as $arg) {
    if ($arg === '--dry-run') {
        $dryRun = true;
    } elseif ($arg === '--force') {
        $force = true;
    } elseif (str_starts_with($arg, '--')) {
        fail('Unknown option: ' . $arg);
    } elseif ($orderId === null) {
        $orderId = $arg;
    }
}

if ($orderId === null || $orderId === '') {
    fail("Usage: php scripts/generate_dpd_label.php <UNAS_ORDER_ID> [--dry-run] [--force]");
}

line('=== DPD label generation for UNAS order ' . $orderId . ($dryRun ? ' (DRY RUN)' : '') . ' ===');

// --- guard against duplicate waybills --------------------------------
$shipments = new DpdShipmentRepository();
if (!$dryRun) {
    $existing = $shipments->findByUnasOrderId((string) $orderId);
    if ($existing !== null && ($existing['status'] ?? '') === 'created' && !$force) {
        line('A label already exists for this order:');
        line('  waybills:   ' . ($existing['waybills'] ?? ''));
        line('  label file: ' . ($existing['label_path'] ?? 'n/a'));
        line('Re-run with --force to register a second (duplicate) waybill.');
        exit(0);
    }
}

// --- 1. fetch the order from UNAS ------------------------------------
line('[1/4] Fetching order from UNAS ...');
$unas = new UnasApiService(
    (string) App::config('unas.api_key'),
    (string) App::config('unas.base_url'),
    (int) App::config('unas.rate_limit_per_minute')
);

try {
    $response = $unas->getOrderDetails((string) $orderId);
} catch (\Throwable $e) {
    fail('  UNAS fetch failed: ' . $e->getMessage());
}

$orderNode = $response['Order'] ?? null;
if (is_array($orderNode) && !array_is_list($orderNode)) {
    $order = $orderNode;                 // single order (assoc)
} elseif (is_array($orderNode) && $orderNode !== []) {
    $order = $orderNode[0];              // list -> first
} else {
    fail('  UNAS returned no <Order> for id ' . $orderId . ' - check the id and that the order exists.');
}
if (!is_array($order)) {
    fail('  Unexpected UNAS order shape for id ' . $orderId . '.');
}
line('  OK - order fetched.');

// --- 2. map to the DPD package ---------------------------------------
line('[2/4] Mapping order to DPD package ...');
$mapper = new DpdOrderMapper();

$senderConfig = (array) App::config('dpd.sender', []);
$senderConfig['fid'] = (string) App::config('dpd.sender_fid');

$codMethods = array_values(array_filter(array_map(
    static fn (string $m): string => trim($m),
    explode(',', (string) App::config('dpd.cod_payment_methods', ''))
), static fn (string $m): bool => $m !== ''));

$options = [
    'default_weight_kg' => (float) App::config('dpd.default_parcel_weight_kg', 1.0),
    'cod_payment_methods' => $codMethods,
    'cod_currency' => (string) App::config('dpd.cod_currency', 'PLN'),
];

try {
    $package = $mapper->buildPackage($order, $senderConfig, $options);
    $sessionType = $mapper->resolveSessionType($order, $senderConfig);
} catch (\Throwable $e) {
    fail('  Mapping failed: ' . $e->getMessage());
}
line('  OK - sessionType: ' . $sessionType);

// --- dry run: show the payload and stop ------------------------------
if ($dryRun) {
    line('');
    line('--- DPD openUMLFeV3 payload that WOULD be sent (no call made) ---');
    line((string) json_encode($package, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    $hasCod = isset($package['packages'][0]['services']['cod']);
    line('');
    line('COD (cash on delivery): ' . ($hasCod ? 'YES - ' . json_encode($package['packages'][0]['services']['cod']) : 'no'));
    line('Dry run complete - nothing was sent to DPD and nothing was saved.');
    exit(0);
}

// --- 3. register parcels (waybill numbers) ---------------------------
$pageFormat = (string) App::config('dpd.label_page_format', 'A4');
$senderFid = (string) App::config('dpd.sender_fid');
$dpd = new DpdApiService(
    (string) App::config('dpd.login'),
    (string) App::config('dpd.password'),
    (string) App::config('dpd.master_fid'),
    (string) App::config('dpd.env'),
    (string) App::config('dpd.wsdl_url') !== '' ? (string) App::config('dpd.wsdl_url') : null,
    (int) App::config('dpd.rate_limit_per_minute')
);

line('[3/4] Registering parcel(s) with DPD (generatePackagesNumbersV4) ...');
try {
    $numbersResponse = $dpd->generatePackageNumbers($package);
} catch (\Throwable $e) {
    $shipments->save([
        'unas_order_id' => (string) $orderId,
        'sender_fid' => $senderFid,
        'label_page_format' => $pageFormat,
        'status' => 'failed',
        'error_message' => $e->getMessage(),
    ]);
    fail('  Package registration failed: ' . $e->getMessage() . ' (see storage/logs/dpd_soap_last.xml)');
}

$status = $dpd->extractStatus($numbersResponse);
$sessionId = $dpd->extractSessionId($numbersResponse);
$waybills = $dpd->extractWaybills($numbersResponse);

if ($sessionId === null || $waybills === []) {
    $shipments->save([
        'unas_order_id' => (string) $orderId,
        'sender_fid' => $senderFid,
        'label_page_format' => $pageFormat,
        'status' => 'failed',
        'error_message' => 'No sessionId/waybill in response (status=' . ($status ?? 'n/a') . ').',
    ]);
    fail('  DPD did not return a sessionId/waybill (status=' . ($status ?? 'n/a') . '). See storage/logs/dpd_soap_last.xml.');
}
line('  OK - waybill(s): ' . implode(', ', $waybills) . ' | sessionId: ' . $sessionId);

// --- 4. render + save the label PDF ----------------------------------
line('[4/4] Generating label PDF (generateSpedLabelsV4) ...');
try {
    $labelResponse = $dpd->generateLabelsBySession($sessionId, $sessionType, $pageFormat);
    $pdf = $dpd->extractLabelPdf($labelResponse);
} catch (\Throwable $e) {
    $shipments->save([
        'unas_order_id' => (string) $orderId,
        'session_id' => $sessionId,
        'waybills' => $waybills,
        'sender_fid' => $senderFid,
        'parcel_count' => count($waybills),
        'label_page_format' => $pageFormat,
        'status' => 'failed',
        'error_message' => 'Parcels registered (' . implode(',', $waybills) . ') but label render failed: ' . $e->getMessage(),
    ]);
    fail('  Label render failed AFTER parcels were registered. Waybill(s): ' . implode(', ', $waybills)
        . '. Re-render from sessionId ' . $sessionId . ' rather than re-registering. Error: ' . $e->getMessage());
}

if ($pdf === null || $pdf === '') {
    $shipments->save([
        'unas_order_id' => (string) $orderId,
        'session_id' => $sessionId,
        'waybills' => $waybills,
        'sender_fid' => $senderFid,
        'parcel_count' => count($waybills),
        'label_page_format' => $pageFormat,
        'status' => 'failed',
        'error_message' => 'Label response carried no documentData.',
    ]);
    fail('  DPD returned no label document. Waybill(s) registered: ' . implode(', ', $waybills) . '.');
}

$labelsDir = (string) App::config('storage.labels_path', dirname(__DIR__) . '/storage/labels');
if (!is_dir($labelsDir) && !mkdir($labelsDir, 0750, true) && !is_dir($labelsDir)) {
    fail('  Could not create labels directory: ' . $labelsDir);
}

$safeOrderId = preg_replace('/[^A-Za-z0-9_-]/', '_', (string) $orderId) ?? (string) $orderId;
$fileName = 'dpd_' . $safeOrderId . '_' . $waybills[0] . '.pdf';
$absPath = rtrim($labelsDir, '/') . '/' . $fileName;
if (file_put_contents($absPath, $pdf) === false) {
    fail('  Could not write the label PDF to ' . $absPath);
}
$relPath = 'storage/labels/' . $fileName;

$shipments->save([
    'unas_order_id' => (string) $orderId,
    'session_id' => $sessionId,
    'waybills' => $waybills,
    'sender_fid' => $senderFid,
    'parcel_count' => count($waybills),
    'label_page_format' => $pageFormat,
    'label_path' => $relPath,
    'status' => 'created',
]);

line('  OK - label saved.');
line('');
line('=== Done ===');
line('Waybill(s): ' . implode(', ', $waybills));
line('Label PDF:  ' . $relPath . ' (' . strlen($pdf) . ' bytes)');
exit(0);
