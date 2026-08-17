<?php

declare(strict_types=1);

/**
 * PHASE 1 diagnostic: safe, read-only, live Turum B2B API connectivity
 * check.
 *
 * Purpose: confirm auth works and capture small, sanitized samples of
 * real /v1/products_full_list_new and /v1/reservation/{id} responses so
 * the exact response field names/shapes can be read off them before any
 * Turum sync/inventory-batch/FIFO logic is built - see ARCHITECTURE.md
 * "Turum integration status". This script does not have direct access
 * to the Turum OpenAPI spec file itself, only the field/endpoint details
 * reported by the project owner - anything not explicitly confirmed
 * there is deliberately left unimplemented rather than guessed.
 *
 * What this script does, in order, at most once each (no retry loops -
 * the docs explicitly cap /v1/products_full_list_new at 1 request/minute,
 * and hammering any endpoint on failure only makes diagnosis harder):
 *   1. Authenticate (POST /v1/account/login).
 *   2. Fetch account metadata (GET /v1/account/me).
 *   3. Fetch the full product catalog EXACTLY ONCE (GET /v1/products_full_list_new).
 *   4. Fetch a small page of reservations (GET /v1/reservations).
 *   5. If any reservation exists, fetch ONE reservation's detail
 *      (GET /v1/reservation/{id}).
 *
 * What it does NOT do:
 *   - Never prints or writes the username, password, or Bearer token
 *     anywhere.
 *   - Never writes to any business table - the only database write is
 *     the existing api_logs trail TurumApiService::request() always
 *     performs (endpoint/status/duration metadata only, no secrets).
 *   - Never retries a failed call.
 *   - Never calls /v1/products_full_list_new more than once (enforced
 *     both by this script's control flow and by TurumApiService's
 *     dedicated 1-request/minute limiter for that endpoint).
 *
 * Output: status lines to the console only. Response content is written
 * to disk, sanitized (see below), never printed to the terminal, since
 * account/reservation data may legitimately contain company/customer
 * data.
 *
 * Sanitization strategy:
 *   - Product catalog sample: explicit field allow-list (sku, price,
 *     brand, and per-variant variant_id/size/eu_size/stock/has_more/
 *     price/ean) - product catalog data isn't PII, this just keeps the
 *     saved sample small and scoped to what Phase 2 needs, out of a
 *     potentially very large full-catalog response.
 *   - Account/reservation samples: recursive redaction by key-name
 *     keyword (see redactSensitive()) - the real field names for
 *     company/customer/contact/invoice data aren't confirmed yet, so an
 *     exact allow-list isn't possible here the way it is for products;
 *     redaction is the safer default until Phase 2 confirms exact
 *     shapes worth allow-listing.
 *
 * Usage:
 *   php scripts/test_turum_connection.php
 *
 * Run this ON THE SERVER where real TURUM_USERNAME/TURUM_PASSWORD are
 * configured - it needs outbound HTTPS access to api.b2b.turum.pl.
 */

require __DIR__ . '/../app/Core/Autoloader.php';

use App\Core\App;
use App\Services\TurumApiService;

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

/**
 * Key-name keywords treated as sensitive: PII (name/email/phone/address/
 * etc, per "redact all company/customer/address/contact/invoice personal
 * data") plus auth secrets (token/password) as a defense-in-depth safety
 * net alongside the explicit token handling below. Substring match, so
 * e.g. "company_name" or "billing_address" are caught too - the accepted
 * tradeoff (same as the UNAS diagnostic's redaction) is an occasional
 * false positive (a field merely containing one of these substrings)
 * over a false negative that leaks real PII.
 */
const SENSITIVE_KEY_PATTERN = '/name|email|phone|mobile|address|zip|postcode|city|country|card|iban|tax|bank|company|contact|invoice|customer|token|password|secret/i';

/**
 * Recursively redacts any array value whose key matches
 * SENSITIVE_KEY_PATTERN, and masks any email-looking string left over
 * elsewhere (a safety net for PII sitting in a field this pattern didn't
 * anticipate). Deliberately conservative - see class-level docblock.
 */
function redactSensitive(mixed $value): mixed
{
    if (is_array($value)) {
        $result = [];
        foreach ($value as $key => $v) {
            if (is_string($key) && preg_match(SENSITIVE_KEY_PATTERN, $key) === 1) {
                $result[$key] = '[REDACTED]';
            } else {
                $result[$key] = redactSensitive($v);
            }
        }

        return $result;
    }

    if (is_string($value)) {
        return preg_replace('/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/', '[REDACTED-EMAIL]', $value) ?? $value;
    }

    return $value;
}

function saveJsonSample(string $path, mixed $data): void
{
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0750, true);
    }

    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    line('  Saved sanitized sample to ' . $path);
}

/**
 * Explicit field allow-list for the product catalog sample - see
 * "Sanitization strategy" in the file docblock for why this differs
 * from the redact-by-keyword approach used elsewhere in this script.
 * Assumes the response shape {"data": [{...product with "variants":[...]}]}
 * exactly as reported; if the real response differs, $products below
 * will simply come back empty and this function returns [] rather than
 * guessing at a different shape.
 *
 * @return array<int, array<string, mixed>>
 */
function extractProductSample(array $decoded, int $limit): array
{
    $products = is_array($decoded['data'] ?? null) ? $decoded['data'] : [];
    $sample = [];

    foreach (array_slice($products, 0, $limit) as $product) {
        if (!is_array($product)) {
            continue;
        }

        $variants = [];
        $rawVariants = is_array($product['variants'] ?? null) ? $product['variants'] : [];
        foreach ($rawVariants as $variant) {
            if (!is_array($variant)) {
                continue;
            }
            $variants[] = [
                'variant_id' => $variant['variant_id'] ?? null,
                'size' => $variant['size'] ?? null,
                'eu_size' => $variant['eu_size'] ?? null,
                'stock' => $variant['stock'] ?? null,
                'has_more' => $variant['has_more'] ?? null,
                'price' => $variant['price'] ?? null,
                'ean' => $variant['ean'] ?? null,
            ];
        }

        $sample[] = [
            'sku' => $product['sku'] ?? null,
            'price' => $product['price'] ?? null,
            'brand' => $product['brand'] ?? null,
            'variants' => $variants,
        ];
    }

    return $sample;
}

/**
 * Defensively extracts the first reservation's identifier from a
 * /v1/reservations response without assuming a single confirmed shape -
 * tries the documented {"data": [...]} envelope (matching the product
 * catalog's shape) first, then a bare top-level list, since the exact
 * /v1/reservations response shape isn't confirmed.
 */
function firstReservationId(array $decoded): ?string
{
    $list = is_array($decoded['data'] ?? null) ? $decoded['data'] : $decoded;

    if (!is_array($list)) {
        return null;
    }

    foreach ($list as $item) {
        if (is_array($item) && isset($item['reservation_id']) && is_scalar($item['reservation_id'])) {
            return (string) $item['reservation_id'];
        }
    }

    return null;
}

line('=== Turum API connection diagnostic ===');
line('Base URL: ' . App::config('turum.base_url'));
line('Turum credentials configured: ' . (App::config('turum.username') !== '' && App::config('turum.password') !== '' ? 'yes' : 'NO - set TURUM_USERNAME/TURUM_PASSWORD in .env'));
line('');

$turum = new TurumApiService(
    (string) App::config('turum.username'),
    (string) App::config('turum.password'),
    (string) App::config('turum.base_url'),
    (int) App::config('turum.rate_limit_per_minute')
);

$storageLogsDir = dirname(__DIR__) . '/storage/logs';
$callsMade = 0;
$failures = 0;

// --- Step 1: authenticate --------------------------------------------
line('[1/5] Authenticating (POST /v1/account/login) ...');
$callsMade++;

try {
    $turum->authenticate();
} catch (\Throwable $e) {
    line('  Result: FAILED');
    line('  HTTP status: ' . ($turum->lastHttpStatus() ?? 'n/a (no response / network error)'));
    // The exception message is built by TurumApiService and is
    // guaranteed not to contain the username/password/token.
    errline('  Error: ' . $e->getMessage());
    line('');
    line('Stopping here - no further calls will be made without a valid session.');
    exit(1);
}

line('  Result: SUCCESS');
line('  HTTP status: ' . ($turum->lastHttpStatus() ?? 'n/a'));
$expiresAt = $turum->tokenExpiresAt();
line('  Token expires at: ' . ($expiresAt !== null ? $expiresAt->format(DATE_ATOM) : 'unknown') . ' (computed as now+24h per documented validity - not read from a response field, see TurumApiService).');
line('');

// --- Step 2: account metadata -------------------------------------------
line('[2/5] Fetching account metadata (GET /v1/account/me) ...');
$callsMade++;

try {
    $account = $turum->getAccountMe();
    line('  Result: SUCCESS');
    line('  HTTP status: ' . ($turum->lastHttpStatus() ?? 'n/a'));
    $sanitizedAccount = redactSensitive($account);
    saveJsonSample($storageLogsDir . '/turum_sample_account.json', $sanitizedAccount);
    line('  Top-level fields present: ' . (is_array($account) ? implode(', ', array_keys($account)) : 'n/a'));
} catch (\Throwable $e) {
    $failures++;
    line('  Result: FAILED');
    line('  HTTP status: ' . ($turum->lastHttpStatus() ?? 'n/a'));
    errline('  Error: ' . $e->getMessage());
}
line('');

// --- Step 3: full product catalog - EXACTLY ONCE -------------------------
line('[3/5] Fetching product catalog (GET /v1/products_full_list_new) - exactly once, per the documented 1 req/min limit ...');
$callsMade++;

try {
    $products = $turum->getProductsFullList();
    line('  Result: SUCCESS');
    line('  HTTP status: ' . ($turum->lastHttpStatus() ?? 'n/a'));
    $totalProducts = is_array($products['data'] ?? null) ? count($products['data']) : null;
    line('  Total products in response: ' . ($totalProducts ?? 'unknown (response did not have the expected {"data": [...]} shape)'));
    $sample = extractProductSample($products, 5);
    saveJsonSample($storageLogsDir . '/turum_sample_products.json', $sample);
    line('  Sample saved: ' . count($sample) . ' product(s) (of ' . ($totalProducts ?? '?') . ' total), allow-listed fields only.');
} catch (\Throwable $e) {
    $failures++;
    line('  Result: FAILED');
    line('  HTTP status: ' . ($turum->lastHttpStatus() ?? 'n/a'));
    errline('  Error: ' . $e->getMessage());
}
line('');

// --- Step 4: reservations list, small page ------------------------------
line('[4/5] Fetching a small page of reservations (GET /v1/reservations) ...');
$callsMade++;
$reservationId = null;

try {
    // "limit" is a common REST pagination convention but is NOT a
    // confirmed Turum query param name - if wrong, this most likely
    // returns the default page size rather than erroring; check the
    // actual count below against what was requested.
    $reservations = $turum->getReservations(['limit' => 5]);
    line('  Result: SUCCESS');
    line('  HTTP status: ' . ($turum->lastHttpStatus() ?? 'n/a'));
    $reservationList = is_array($reservations['data'] ?? null) ? $reservations['data'] : $reservations;
    $reservationCount = is_array($reservationList) ? count($reservationList) : 0;
    line('  Reservations returned: ' . $reservationCount . ' (requested limit=5 - if this is much larger, the "limit" param name is likely wrong, see file header comment).');
    $reservationId = firstReservationId($reservations);
} catch (\Throwable $e) {
    $failures++;
    line('  Result: FAILED');
    line('  HTTP status: ' . ($turum->lastHttpStatus() ?? 'n/a'));
    errline('  Error: ' . $e->getMessage());
}
line('');

// --- Step 5: one reservation detail, only if any reservation exists ------
line('[5/5] Fetching one reservation detail (GET /v1/reservation/{id}) ...');

if ($reservationId === null) {
    line('  Skipped: no reservation_id available (either no reservations exist, or step 4 failed, or the response shape did not match {"data":[{"reservation_id":...}]}).');
} else {
    $callsMade++;
    try {
        $detail = $turum->getReservationDetail($reservationId);
        line('  Result: SUCCESS (reservation_id redacted from this log line by design - not printed).');
        line('  HTTP status: ' . ($turum->lastHttpStatus() ?? 'n/a'));
        $sanitizedDetail = redactSensitive($detail);
        saveJsonSample($storageLogsDir . '/turum_sample_reservation.json', $sanitizedDetail);
    } catch (\Throwable $e) {
        $failures++;
        line('  Result: FAILED');
        line('  HTTP status: ' . ($turum->lastHttpStatus() ?? 'n/a'));
        errline('  Error: ' . $e->getMessage());
    }
}

line('');
line('=== Done: ' . $callsMade . ' API call(s) made, ' . $failures . ' failure(s). ===');
line('Every call above was also logged to the api_logs table (endpoint/status/duration only, no secrets) by TurumApiService.');
line('Inspect storage/logs/turum_sample_{account,products,reservation}.json to confirm the real response field names/shapes before implementing any Turum sync logic.');

exit($failures > 0 ? 1 : 0);
