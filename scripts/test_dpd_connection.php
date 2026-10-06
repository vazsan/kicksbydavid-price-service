<?php

declare(strict_types=1);

/**
 * SAFE DPD connectivity check - creates NO shipment and registers NO
 * waybill. It only:
 *   1. Confirms the PHP SOAP extension is present.
 *   2. Loads the DPD WSDL (production or sandbox, per DPD_ENV).
 *   3. Writes the authoritative operation signatures and type map to
 *      storage/logs/dpd_wsdl_functions.txt and dpd_wsdl_types.txt, so the
 *      exact parameter names can be read off the real WSDL and lined up
 *      against DpdApiService's request builders before any live call.
 *   4. Reports whether generatePackagesNumbersV4 / generateSpedLabelsV4
 *      are exposed by this account's WSDL.
 *
 * It does NOT validate the login/password/masterFID: DPD has no
 * credential-only endpoint, every real operation registers or renders
 * something. Credentials are first exercised by a real (or --dry-run)
 * run of scripts/generate_dpd_label.php.
 *
 * Usage (run ON THE SERVER, where outbound HTTPS to dpd.com.pl works):
 *   php scripts/test_dpd_connection.php
 */

require __DIR__ . '/../app/Core/Autoloader.php';

use App\Core\App;
use App\Services\DpdApiService;

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

function errline(string $message): void
{
    fwrite(STDERR, $message . PHP_EOL);
}

line('=== DPD Polska (DPDServices) connection diagnostic ===');
line('Environment: ' . App::config('dpd.env'));
line('Login configured:      ' . (App::config('dpd.login') !== '' ? 'yes' : 'NO - set DPD_LOGIN in .env'));
line('Password configured:   ' . (App::config('dpd.password') !== '' ? 'yes' : 'NO - set DPD_PASSWORD in .env'));
line('masterFID configured:  ' . (App::config('dpd.master_fid') !== '' ? (string) App::config('dpd.master_fid') : 'NO - set DPD_MASTER_FID in .env'));
line('sender FID configured: ' . (App::config('dpd.sender_fid') !== '' ? (string) App::config('dpd.sender_fid') : 'NO - set DPD_SENDER_FID in .env'));
line('SOAP extension loaded: ' . (extension_loaded('soap') ? 'yes' : 'NO - enable ext-soap in cPanel'));
line('');

if (!extension_loaded('soap')) {
    errline('The PHP SOAP extension is required and not enabled. Stopping.');
    exit(1);
}

$dpd = new DpdApiService(
    (string) App::config('dpd.login'),
    (string) App::config('dpd.password'),
    (string) App::config('dpd.master_fid'),
    (string) App::config('dpd.env'),
    (string) App::config('dpd.wsdl_url') !== '' ? (string) App::config('dpd.wsdl_url') : null,
    (int) App::config('dpd.rate_limit_per_minute')
);

line('WSDL: ' . $dpd->wsdlUrl());
line('[1/2] Loading WSDL and reading operation signatures ...');

$logsDir = dirname(__DIR__) . '/storage/logs';
if (!is_dir($logsDir)) {
    mkdir($logsDir, 0750, true);
}

try {
    $functions = $dpd->listFunctions();
} catch (\Throwable $e) {
    line('  Result: FAILED');
    errline('  Error: ' . $e->getMessage());
    line('');
    line('If this is a network/egress error, run it on the production server instead -');
    line('the DPD hosts are often not reachable from a development machine.');
    exit(1);
}

file_put_contents($logsDir . '/dpd_wsdl_functions.txt', implode(PHP_EOL, $functions) . PHP_EOL);
line('  Result: SUCCESS - ' . count($functions) . ' operation(s) exposed.');
line('  Full signatures written to storage/logs/dpd_wsdl_functions.txt');

try {
    $types = $dpd->listTypes();
    file_put_contents($logsDir . '/dpd_wsdl_types.txt', implode(PHP_EOL . PHP_EOL, $types) . PHP_EOL);
    line('  Type map written to storage/logs/dpd_wsdl_types.txt (' . count($types) . ' types).');
} catch (\Throwable $e) {
    line('  (Could not read the type map: ' . $e->getMessage() . ')');
}
line('');

line('[2/2] Checking for the operations this integration uses ...');
$needed = ['generatePackagesNumbersV4', 'generateSpedLabelsV4'];
$allPresent = true;
foreach ($needed as $op) {
    $present = false;
    foreach ($functions as $signature) {
        if (stripos($signature, $op . '(') !== false || stripos($signature, ' ' . $op . '(') !== false || stripos($signature, $op) !== false) {
            $present = true;
            break;
        }
    }
    $allPresent = $allPresent && $present;
    line('  ' . ($present ? '[OK]  ' : '[!!]  ') . $op . ($present ? ' is available' : ' NOT found - check dpd_wsdl_functions.txt for the exact version your account exposes'));
}
line('');

if ($allPresent) {
    line('=== OK: WSDL reachable and the needed operations are present. ===');
    line('Next: generate a label for a real order with');
    line('  php scripts/generate_dpd_label.php <UNAS_ORDER_ID> --dry-run   (inspect the mapped payload, no live call)');
    line('  php scripts/generate_dpd_label.php <UNAS_ORDER_ID>             (live: registers a waybill and saves the PDF)');
    exit(0);
}

line('=== WARNING: some expected operations were not found. ===');
line('Open storage/logs/dpd_wsdl_functions.txt, find the matching generatePackagesNumbers / generateSpedLabels version,');
line('and adjust the operation names in app/Services/DpdApiService.php if your account exposes a different one.');
exit(1);
