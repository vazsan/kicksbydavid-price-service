<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Logger;
use App\Helpers\RateLimiter;
use App\Repositories\ApiLogRepository;

/**
 * Client for the UNAS Webshop API (https://unas.hu/tudastar/api).
 *
 * STATUS: authentication and the low-level request pipeline are confirmed
 * against real, live responses (production). getOrders()/getProducts()
 * accept and send the documented filter fields. RESPONSE field mapping
 * (turning UNAS's XML into orders/order_items/order_adjustments/
 * product_variants rows) lives in cron/sync_unas_orders.php and
 * cron/sync_unas_products.php, using only fields confirmed against real
 * samples - see ARCHITECTURE.md "UNAS API integration status" for the
 * full mapping table and what's still unconfirmed. This class itself only
 * speaks the wire protocol; it does not know what an Order or a Product
 * XML tree looks like beyond auth, on purpose - see "Do not guess" in
 * ARCHITECTURE.md.
 *
 * Confirmed protocol (https://unas.hu/tudastar/api and linked pages):
 *   - Base URL: https://api.unas.eu/shop , all functions use HTTP POST.
 *   - Request and response bodies are XML (not JSON).
 *   - Auth is two-step: POST <Params><ApiKey>...</ApiKey></Params> to
 *     /login; the response (root <Login>) contains <Token>, <Expire>
 *     (formatted "Y.m.d H:i:s") and <ExpireTime> (the same expiry as a
 *     UNIX timestamp - authoritative, see parseExpiry()). Every
 *     subsequent request sends that token as
 *     "Authorization: Bearer {token}". Within the expiry window the same
 *     token is reused - no need to re-login before every call.
 *   - /getOrder lists orders. Documented filter fields include DateStart,
 *     DateEnd, StatusID (an order-status serial number OR one of the
 *     status *types* open_normal | open_prepare | close_ok | close_fault)
 *     and InvoiceStatus (one or more status names, pipe-separated). If no
 *     limit is given, UNAS caps a single response at 500 orders.
 *   - /getProduct lists products. Documented filter fields include
 *     StatusBase, LimitNum, LimitStart (pagination) and ContentType
 *     (e.g. "full" to include the complete record - price, stock,
 *     parameters, etc. - instead of a minimal one).
 *   - /setOrder writes order changes back (status updates etc.) in the
 *     same data shape /getOrder returns them in. Not used yet in this
 *     codebase (V1 only reads).
 *
 * Exact response XML tag names (order line items, product/SKU/variant
 * structure, customer fields) are NOT hardcoded here - they must be read
 * off a real sample response first. Use scripts/test_unas_connection.php
 * to fetch one and inspect it before extending this class with response
 * parsing.
 */
final class UnasApiService
{
    private const PROVIDER = 'UNAS';

    private ?string $token = null;
    private ?\DateTimeImmutable $tokenExpiresAt = null;

    /** Set on every request() call; read by diagnostics, never by business logic. */
    private ?int $lastHttpStatus = null;
    private string $lastRawResponseBody = '';

    private readonly RateLimiter $rateLimiter;
    private readonly ApiLogRepository $apiLog;

    public function __construct(
        private readonly string $apiKey,
        private readonly string $baseUrl,
        int $rateLimitPerMinute,
        ?string $rateLimiterCacheFile = null
    ) {
        $this->rateLimiter = new RateLimiter(
            $rateLimiterCacheFile ?? dirname(__DIR__, 2) . '/storage/cache/unas_rate_limit.json',
            $rateLimitPerMinute
        );
        $this->apiLog = new ApiLogRepository();
    }

    // -------------------------------------------------------------
    // Authentication
    // -------------------------------------------------------------

    /**
     * Exchanges the shop's static API key for a short-lived access token.
     * Cached in-memory for the lifetime of this instance; callers don't
     * need to call this directly - request() calls it automatically when
     * there is no valid token yet.
     */
    public function authenticate(): void
    {
        if ($this->apiKey === '') {
            throw new \RuntimeException('UNAS_API_KEY is not configured. Set it in .env.');
        }

        $response = $this->request('POST', '/login', [
            'ApiKey' => $this->apiKey,
        ], authenticated: false);

        $token = $response['Token'] ?? null;
        $expireTime = $response['ExpireTime'] ?? null;
        $expire = $response['Expire'] ?? null;

        if (!is_string($token) || $token === '') {
            throw new \RuntimeException('UNAS authentication did not return a token.');
        }

        $this->token = $token;
        $this->tokenExpiresAt = $this->parseExpiry($expireTime, $expire);
    }

    /**
     * Confirmed against a real login response (2026-08, production):
     *   <Login>
     *       <Token>...</Token>
     *       <Expire>2026.08.17 05:01:35</Expire>
     *       <ExpireTime>1786935695</ExpireTime>
     *       <ShopId>...</ShopId>
     *       <Status>ok</Status>
     *   </Login>
     * ExpireTime is the authoritative absolute UNIX timestamp and is used
     * whenever present; Expire (format "Y.m.d H:i:s", dot-separated date -
     * note this is NOT the same as the ISO "Y-m-d" used elsewhere in this
     * codebase for UNAS request filters) is only a fallback for a response
     * that somehow omits ExpireTime.
     */
    private function parseExpiry(mixed $expireTime, mixed $expire): ?\DateTimeImmutable
    {
        if (is_numeric($expireTime)) {
            return (new \DateTimeImmutable())->setTimestamp((int) $expireTime);
        }

        if (is_string($expire) && $expire !== '') {
            $parsed = \DateTimeImmutable::createFromFormat('Y.m.d H:i:s', $expire);
            if ($parsed !== false) {
                return $parsed;
            }

            // Last-resort fallback in case the format ever changes.
            try {
                return new \DateTimeImmutable($expire);
            } catch (\Exception) {
                return null;
            }
        }

        return null;
    }

    private function ensureAuthenticated(): void
    {
        $needsAuth = $this->token === null
            || $this->tokenExpiresAt === null
            || $this->tokenExpiresAt <= new \DateTimeImmutable('+30 seconds');

        if ($needsAuth) {
            $this->authenticate();
        }
    }

    public function tokenExpiresAt(): ?\DateTimeImmutable
    {
        return $this->tokenExpiresAt;
    }

    // -------------------------------------------------------------
    // Orders
    // -------------------------------------------------------------

    /**
     * Fetches a page of orders per the documented /getOrder filters.
     * Returns the response decoded as a plain array with no assumptions
     * about its inner shape - callers inspecting a live response should
     * dump the array (or better, read the raw XML - see
     * lastRawResponseBody()) rather than assume a structure.
     *
     * @param array{
     *     DateStart?: string,
     *     DateEnd?: string,
     *     StatusID?: string,
     *     InvoiceStatus?: string,
     *     LimitNum?: int,
     *     LimitStart?: int
     * } $filters DateStart/DateEnd/StatusID/InvoiceStatus are confirmed
     *     documented fields. LimitNum/LimitStart are confirmed for
     *     /getProduct and passed through here on the (unconfirmed)
     *     assumption /getOrder shares the same pagination convention -
     *     verify with scripts/test_unas_connection.php before relying on it.
     * @return array<string, mixed> Raw decoded response.
     */
    public function getOrders(array $filters = []): array
    {
        return $this->request('POST', '/getOrder', $filters);
    }

    /**
     * Fetches a single order by UNAS order id. Field name for the filter
     * (assumed "OrderID" here, matching UNAS's PascalCase convention seen
     * elsewhere) is unconfirmed - verify against a real response before
     * relying on this for anything beyond a manual diagnostic.
     *
     * @return array<string, mixed>
     */
    public function getOrderDetails(string $unasOrderId): array
    {
        return $this->request('POST', '/getOrder', ['OrderID' => $unasOrderId]);
    }

    /**
     * Writes an order status change back to UNAS via /setOrder (confirmed
     * endpoint name; exact field shape unconfirmed - /setOrder is
     * documented as accepting data in the same shape /getOrder returns
     * it, so this needs a real getOrder sample before it can be
     * implemented correctly). Not used anywhere yet - V1 only reads
     * orders.
     */
    public function setOrder(array $orderData): array
    {
        return $this->request('POST', '/setOrder', $orderData);
    }

    // -------------------------------------------------------------
    // Products / SKUs
    // -------------------------------------------------------------

    /**
     * Fetches product records per the documented /getProduct filters.
     * UNAS represents e.g. shoe sizes as separate SKUs under one parent
     * product - see product_variants in the schema - but the exact
     * response shape for that parent/variant relationship is unconfirmed
     * pending a live sample; do not assume a structure here.
     *
     * Per the docs, price/stock/etc. are components of the full product
     * record (ContentType=full), not separate endpoints - there is no
     * documented standalone "get stock for one SKU" call, so this class
     * does not expose one.
     *
     * @param array{
     *     StatusBase?: string,
     *     LimitNum?: int,
     *     LimitStart?: int,
     *     ContentType?: string
     * } $filters
     * @return array<string, mixed> Raw decoded response.
     */
    public function getProducts(array $filters = []): array
    {
        return $this->request('POST', '/getProduct', array_merge(
            ['ContentType' => 'full'],
            $filters
        ));
    }

    // -------------------------------------------------------------
    // Diagnostics
    // -------------------------------------------------------------

    /**
     * HTTP status of the most recent request() call, if any. For
     * diagnostics/logging only - business logic should rely on
     * request() throwing on failure, not on polling this.
     */
    public function lastHttpStatus(): ?int
    {
        return $this->lastHttpStatus;
    }

    /**
     * Raw (undecoded) XML body of the most recent request() call, success
     * or failure. Needed because decodeBody() throws away structure
     * (attributes, element order) that matters when reverse-engineering
     * the real response shape - see scripts/test_unas_connection.php.
     */
    public function lastRawResponseBody(): string
    {
        return $this->lastRawResponseBody;
    }

    // -------------------------------------------------------------
    // Low-level request pipeline
    // -------------------------------------------------------------

    /**
     * Sends one HTTP request to the UNAS API with auth, rate limiting,
     * timing, and both success and failure logging to api_logs. A single
     * failed call (network error, non-2xx, malformed XML) never throws
     * past this method uncaught into a batch job - callers (cron
     * scripts) decide whether to skip the record and continue or abort,
     * per the "one bad order shouldn't stop the whole sync" requirement.
     *
     * @param array<string, mixed> $params
     * @return array<string, mixed> Decoded response body.
     */
    private function request(string $method, string $endpoint, array $params = [], bool $authenticated = true): array
    {
        if ($authenticated) {
            $this->ensureAuthenticated();
        }

        $this->rateLimiter->throttle();

        $url = $this->baseUrl . $endpoint;
        $startedAt = new \DateTimeImmutable();
        $startedAtMicro = microtime(true);
        $httpStatus = null;
        $errorMessage = null;
        $body = '';

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_POSTFIELDS => $this->encodeBody($params),
            CURLOPT_HTTPHEADER => $this->buildHeaders($authenticated),
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
        ]);

        try {
            $result = curl_exec($ch);

            if ($result === false) {
                $errorMessage = curl_error($ch);
            } else {
                $body = $result;
                $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            }
        } finally {
            curl_close($ch);
        }

        $this->lastHttpStatus = $httpStatus;
        $this->lastRawResponseBody = $body;

        $durationMs = (int) round((microtime(true) - $startedAtMicro) * 1000);
        $isSuccess = $errorMessage === null && $httpStatus !== null && $httpStatus >= 200 && $httpStatus < 300;

        if (!$isSuccess && $errorMessage === null) {
            $errorMessage = "Unexpected HTTP status {$httpStatus}";
        }

        // Never log the API key/token, even on failure.
        $this->apiLog->log(self::PROVIDER, $endpoint, $method, $startedAt, $httpStatus, $isSuccess, $durationMs, $errorMessage);

        if (!$isSuccess) {
            Logger::error('unas_api', "Request to {$endpoint} failed", [
                'http_status' => $httpStatus,
                'error' => $errorMessage,
            ]);
            throw new \RuntimeException("UNAS API request to {$endpoint} failed: {$errorMessage}");
        }

        return $this->decodeBody($body);
    }

    /**
     * @param array<string, mixed> $params
     */
    private function encodeBody(array $params): string
    {
        $xml = new \SimpleXMLElement('<Params/>');
        $this->arrayToXml($params, $xml);

        return (string) $xml->asXML();
    }

    private function arrayToXml(array $data, \SimpleXMLElement $xml): void
    {
        foreach ($data as $key => $value) {
            $key = is_int($key) ? 'Item' : $key;

            if (is_array($value)) {
                $child = $xml->addChild($key);
                $this->arrayToXml($value, $child);
                continue;
            }

            $xml->addChild($key, htmlspecialchars((string) $value, ENT_XML1));
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeBody(string $body): array
    {
        if (trim($body) === '') {
            return [];
        }

        $previous = libxml_use_internal_errors(true);
        // LIBXML_NOCDATA: confirmed live UNAS responses wrap field values
        // in CDATA (e.g. <Status><![CDATA[Megrendelés lezárva]]></Status>).
        // Without this flag, simplexml_load_string() keeps CDATA sections
        // as a separate node type that json_encode() does not serialize
        // as the element's text, so the field decodes to an empty/missing
        // value instead of the real string - this is why every order's
        // status previously mapped to the "unknown" fallback in
        // UnasOrderMapper::mapOrderHeader(). This flag folds CDATA into
        // plain text nodes, matching a normal (non-CDATA) element.
        $xml = simplexml_load_string($body, \SimpleXMLElement::class, LIBXML_NOCDATA);
        libxml_use_internal_errors($previous);

        if ($xml === false) {
            throw new \RuntimeException('UNAS API returned malformed XML.');
        }

        $json = json_encode($xml);
        $decoded = $json === false ? null : json_decode($json, true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * @return array<int, string>
     */
    private function buildHeaders(bool $authenticated): array
    {
        $headers = ['Content-Type: application/xml; charset=utf-8'];

        if ($authenticated && $this->token !== null) {
            $headers[] = "Authorization: Bearer {$this->token}";
        }

        return $headers;
    }
}
