<?php

declare(strict_types=1);

/**
 * PHASE 1 diagnostic: safe, read-only, live UNAS API connectivity check.
 *
 * Purpose: confirm auth works and capture a small, sanitized sample of
 * real getOrder/getProduct XML so the exact response field names can be
 * read off it (see ARCHITECTURE.md "Next step" - the official docs site
 * and api.unas.eu are both unreachable from the environment this script
 * was written in, so response field mapping could not be implemented or
 * verified ahead of time; this script exists to produce the ground truth
 * for that work instead of guessing it).
 *
 * What this script does, in order, at most once each (no retry loops -
 * UNAS rate-limits failed requests, so hammering it on failure would only
 * make the underlying problem harder to diagnose):
 *   1. Authenticate (POST /login).
 *   2. Fetch a small page of orders (POST /getOrder).
 *   3. Fetch a small page of products (POST /getProduct).
 *
 * Also saves the login response itself (with <Token> redacted) to
 * storage/logs/unas_sample_login.xml, reusing the already-made login
 * call - so the real <Expire> field name/format can be confirmed too.
 *
 * What it does NOT do:
 *   - Never prints or writes the API key or the Bearer token anywhere.
 *   - Never writes to any business table (orders, products, ...) - the
 *     only database write is the existing api_logs trail that
 *     UnasApiService's request() method always performs, which is
 *     metadata about the call (endpoint/status/duration), not shop data.
 *   - Never retries a failed call.
 *
 * Output: status lines to the console only (success/failure, HTTP
 * status, token expiry, byte counts) - never the response content
 * itself. The actual XML is written to disk, best-effort redacted (see
 * redactXml() below) so it's safe to read at the OS level, but it is NOT
 * printed to the terminal since order/product responses may legitimately
 * contain customer data.
 *
 * Usage:
 *   php scripts/test_unas_connection.php
 *
 * Run this ON THE SERVER where the real UNAS_API_KEY is configured
 * (production, or a local copy of .env pointed at the same account) -
 * it needs outbound HTTPS access to api.unas.eu, which this development
 * sandbox does not have.
 */

require __DIR__ . '/../app/Core/Autoloader.php';

use App\Core\App;
use App\Services\UnasApiService;

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('This script can only be run from the command line.');
}

\App\Core\Autoloader::register('App', __DIR__ . '/../app');
$config = App::bootstrap(dirname(__DIR__));

function line(string $message): void
{
    fwrite(STDOUT, $message . PHP_EOL);
}

function errline(string $message): void
{
    fwrite(STDERR, $message . PHP_EOL);
}

/**
 * Best-effort PII redaction for a raw UNAS XML response before it's
 * written to disk.
 *
 * IMPORTANT limitation: this cannot redact by exact field name yet,
 * because the real customer-data tag names in a getOrder response are
 * exactly what Phase 2 needs to discover from this script's own output -
 * a chicken-and-egg problem. Instead it uses two conservative, tag-name-
 * agnostic heuristics:
 *   1. Any element whose tag name contains a common PII keyword (Name,
 *      Email, Phone, Mobile, Address, Zip, Postcode, City, IP, Card,
 *      Iban, TaxNumber, BankAccount) has its text content replaced.
 *   2. Any remaining email-looking substring anywhere else in the
 *      document is masked too, as a safety net for PII sitting in a
 *      field this heuristic didn't anticipate.
 * Once the real field names are confirmed (Phase 2), replace this with
 * an exact allow-list of which tags are safe to keep verbatim.
 */
function redactXml(string $xml): string
{
    $piiTagPattern = '/<((?:[A-Za-z0-9_]*)(?:Name|Email|Phone|Mobile|Address|Zip|Postcode|PostCode|City|IP|Card|Iban|IBAN|TaxNumber|BankAccount)(?:[A-Za-z0-9_]*))(\s[^>]*)?>(.*?)<\/\1>/is';

    $redacted = preg_replace_callback($piiTagPattern, static function (array $m): string {
        $attrs = $m[2] ?? '';
        return "<{$m[1]}{$attrs}>[REDACTED]</{$m[1]}>";
    }, $xml);

    $redacted = $redacted ?? $xml; // preg_replace_callback returns null on a regex engine error - fail safe to the input.

    // Safety net: mask anything that still looks like an email address.
    $redacted = preg_replace('/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/', '[REDACTED-EMAIL]', $redacted) ?? $redacted;

    return $redacted;
}

function saveSample(string $path, string $rawXml): void
{
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0750, true);
    }

    file_put_contents($path, redactXml($rawXml));
    line("  Saved sanitized sample to " . $path . " (" . strlen($rawXml) . " raw bytes).");
}

/**
 * Redacts the <Token> element's content specifically - it isn't PII so
 * redactXml()'s keyword list doesn't catch it, but it's the single most
 * important thing this script must never persist to disk.
 */
function redactToken(string $xml): string
{
    $redacted = preg_replace('/<Token>(.*?)<\/Token>/is', '<Token>[REDACTED]</Token>', $xml);

    return $redacted ?? $xml;
}

line('=== UNAS API connection diagnostic ===');
line('Base URL: ' . App::config('unas.base_url'));
line('API key configured: ' . (App::config('unas.api_key') !== '' ? 'yes' : 'NO - set UNAS_API_KEY in .env'));
line('');

$unas = new UnasApiService(
    (string) App::config('unas.api_key'),
    (string) App::config('unas.base_url'),
    (int) App::config('unas.rate_limit_per_minute')
);

// --- Step 1: authenticate --------------------------------------------
line('[1/3] Authenticating (POST /login) ...');

try {
    $unas->authenticate();
} catch (\Throwable $e) {
    line('  Result: FAILED');
    line('  HTTP status: ' . ($unas->lastHttpStatus() ?? 'n/a (no response / network error)'));
    // The exception message is built by UnasApiService and is guaranteed
    // not to contain the API key or token (see its request() method).
    errline('  Error: ' . $e->getMessage());
    line('');
    line('Stopping here - no order/product calls will be made without a valid session,');
    line('and repeated failed logins can trigger UNAS-side rate limiting.');
    exit(1);
}

line('  Result: SUCCESS');
line('  HTTP status: ' . ($unas->lastHttpStatus() ?? 'n/a'));
$expiresAt = $unas->tokenExpiresAt();
line('  Token expires at: ' . ($expiresAt !== null ? $expiresAt->format(DATE_ATOM) : 'unknown (no Expire field in response, or it did not parse - check storage/logs/unas_api-*.log)'));

$storageLogsDir = dirname(__DIR__) . '/storage/logs';

// Reuses the login call already made above - no extra request. Saved
// specifically so the real <Expire> field name/format can be confirmed
// (UnasApiService::parseExpiry() currently assumes an absolute UNIX
// timestamp; if the line above printed "unknown", the field is either
// named differently or shaped differently - this file is how to tell).
if (!is_dir($storageLogsDir)) {
    mkdir($storageLogsDir, 0750, true);
}
$loginBody = $unas->lastRawResponseBody();
if ($loginBody !== '') {
    file_put_contents($storageLogsDir . '/unas_sample_login.xml', redactXml(redactToken($loginBody)));
    line('  Saved token-redacted login response to ' . $storageLogsDir . '/unas_sample_login.xml');
}
line('');
$callsMade = 1; // login
$failures = 0;

// --- Step 2: a small sample of orders ---------------------------------
line('[2/3] Fetching a small sample of orders (POST /getOrder) ...');

try {
    // LimitNum/LimitStart are confirmed for /getProduct; passed here too
    // on the unconfirmed assumption /getOrder shares the convention -
    // this call is exactly how we find out.
    $unas->getOrders(['LimitNum' => 3, 'LimitStart' => 0]);
    $callsMade++;
    line('  Result: SUCCESS');
    line('  HTTP status: ' . ($unas->lastHttpStatus() ?? 'n/a'));
    saveSample($storageLogsDir . '/unas_sample_orders.xml', $unas->lastRawResponseBody());
} catch (\Throwable $e) {
    $callsMade++;
    $failures++;
    line('  Result: FAILED');
    line('  HTTP status: ' . ($unas->lastHttpStatus() ?? 'n/a'));
    errline('  Error: ' . $e->getMessage());
    // Still worth saving whatever body came back (e.g. an XML error
    // document) - it's useful for diagnosing the exact filter field issue.
    if ($unas->lastRawResponseBody() !== '') {
        saveSample($storageLogsDir . '/unas_sample_orders.xml', $unas->lastRawResponseBody());
    }
}
line('');

// --- Step 3: a small sample of products --------------------------------
line('[3/3] Fetching a small sample of products (POST /getProduct) ...');

try {
    $unas->getProducts(['LimitNum' => 3, 'LimitStart' => 0]);
    $callsMade++;
    line('  Result: SUCCESS');
    line('  HTTP status: ' . ($unas->lastHttpStatus() ?? 'n/a'));
    saveSample($storageLogsDir . '/unas_sample_products.xml', $unas->lastRawResponseBody());
} catch (\Throwable $e) {
    $callsMade++;
    $failures++;
    line('  Result: FAILED');
    line('  HTTP status: ' . ($unas->lastHttpStatus() ?? 'n/a'));
    errline('  Error: ' . $e->getMessage());
    if ($unas->lastRawResponseBody() !== '') {
        saveSample($storageLogsDir . '/unas_sample_products.xml', $unas->lastRawResponseBody());
    }
}

line('');
line('=== Done: ' . $callsMade . ' API call(s) made, ' . $failures . ' failure(s). ===');
line('Every call above was also logged to the api_logs table (endpoint/status/duration only, no secrets) by UnasApiService.');
line('Inspect the saved XML under storage/logs/unas_sample_*.xml to confirm the real response field names before implementing the order/product import.');

exit($failures > 0 ? 1 : 0);
