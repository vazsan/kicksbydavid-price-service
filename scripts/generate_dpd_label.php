<?php

declare(strict_types=1);

/**
 * Generates a DPD Polska shipping label (A4 PDF) for a single UNAS order.
 *
 * The actual flow lives in App\Services\DpdLabelGenerator (shared with the
 * web controller); this script is just a CLI wrapper around it.
 *
 * Usage (run ON THE SERVER with real DPD + UNAS credentials in .env):
 *   php scripts/generate_dpd_label.php <UNAS_ORDER_ID>
 *   php scripts/generate_dpd_label.php <UNAS_ORDER_ID> --dry-run
 *   php scripts/generate_dpd_label.php <UNAS_ORDER_ID> --force
 *
 *   --dry-run  Fetch + map + print the exact DPD payload WITHOUT calling
 *              DPD or saving anything. Use it to verify the address
 *              mapping on a real order before the first live shipment.
 *   --force    Generate even if a label already exists (registers a
 *              SECOND, duplicate waybill - use with care).
 */

require __DIR__ . '/../app/Core/Autoloader.php';

use App\Core\App;
use App\Services\DpdLabelGenerator;

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
    fail('Usage: php scripts/generate_dpd_label.php <UNAS_ORDER_ID> [--dry-run] [--force]');
}

line('=== DPD label generation for UNAS order ' . $orderId . ($dryRun ? ' (DRY RUN)' : '') . ' ===');

$generator = DpdLabelGenerator::fromConfig();

// --- dry run: fetch + map + print, nothing sent ----------------------
if ($dryRun) {
    try {
        $preview = $generator->preview((string) $orderId);
    } catch (\Throwable $e) {
        fail('Dry run failed: ' . $e->getMessage());
    }

    line('sessionType: ' . $preview['sessionType']);
    line('');
    line('--- DPD openUMLFeV3 payload that WOULD be sent (no call made) ---');
    line((string) json_encode($preview['package'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    line('');
    line('COD (cash on delivery): ' . ($preview['hasCod']
        ? 'YES - ' . json_encode($preview['package']['packages'][0]['services']['cod'])
        : 'no'));
    line('Dry run complete - nothing was sent to DPD and nothing was saved.');
    exit(0);
}

// --- live -------------------------------------------------------------
try {
    $result = $generator->generate((string) $orderId, $force);
} catch (\Throwable $e) {
    fail('Label generation failed: ' . $e->getMessage() . ' (see storage/logs/dpd_soap_last.xml on a SOAP error)');
}

if ($result['already_existed']) {
    line('A label already exists for this order (use --force to register a duplicate):');
    line('  waybills:   ' . implode(', ', $result['waybills']));
    line('  label file: ' . ($result['label_path'] ?? 'n/a'));
    exit(0);
}

line('=== Done ===');
line('Waybill(s): ' . implode(', ', $result['waybills']));
line('Label PDF:  ' . ($result['label_path'] ?? 'n/a') . ' (' . $result['pdf_bytes'] . ' bytes)');
exit(0);
