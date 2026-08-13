<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Logger;
use App\Helpers\RateLimiter;
use App\Repositories\ApiLogRepository;

/**
 * Client for the UNAS Webshop API (https://unas.hu/tudastar/api).
 *
 * STATUS: skeleton. Authentication, the generic request/response pipeline,
 * rate limiting and error logging are fully wired and usable. The
 * business-specific methods below (getOrders, getOrderDetails,
 * getProducts, ...) have the signature and documented return shape the
 * rest of the app (order import, product import) will be built against,
 * but their XML field mapping is left as TODO until we can validate it
 * against a real UNAS account response - see the "Next step" note in
 * ARCHITECTURE.md and the list of fields requested in the final summary
 * of this session.
 *
 * Protocol notes (from UNAS's public API docs, to be confirmed against a
 * live account once credentials are available):
 *   - Transport is HTTPS, request/response bodies are XML (not JSON).
 *   - Auth is two-step: POST the shop's API key to /login, receive a
 *     short-lived Bearer token back, then send that token as an
 *     "Authorization: Bearer {token}" header on subsequent calls.
 *   - Most endpoints accept an XML <Params> document (filters, paging)
 *     and return an XML document of matching records.
 */
final class UnasApiService
{
    private const PROVIDER = 'UNAS';

    private ?string $token = null;
    private ?\DateTimeImmutable $tokenExpiresAt = null;

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

        // TODO: confirm exact response field names against a live account.
        $token = $response['Token'] ?? null;
        $expiresInSeconds = (int) ($response['Expire'] ?? 3600);

        if (!is_string($token) || $token === '') {
            throw new \RuntimeException('UNAS authentication did not return a token.');
        }

        $this->token = $token;
        $this->tokenExpiresAt = (new \DateTimeImmutable())->modify("+{$expiresInSeconds} seconds");
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

    // -------------------------------------------------------------
    // Orders
    // -------------------------------------------------------------

    /**
     * Fetches a page of order summaries, optionally filtered by date
     * range / status, for the periodic order sync
     * (cron/sync_unas_orders.php). Pagination shape TBD once confirmed
     * against the real API (UNAS typically pages via LimitStart/LimitNum
     * or a cursor - keeping $filters generic until then).
     *
     * @param array{from?: string, to?: string, status?: string, limit?: int, offset?: int} $filters
     * @return array<int, array<string, mixed>> Raw per-order records as returned by UNAS.
     */
    public function getOrders(array $filters = []): array
    {
        return $this->request('POST', '/getOrder', $filters);
    }

    /**
     * Fetches full detail for a single order (line items, prices,
     * discounts, shipping, payment method) by its UNAS order id.
     *
     * @return array<string, mixed>
     */
    public function getOrderDetails(string $unasOrderId): array
    {
        return $this->request('POST', '/getOrder', ['OrderId' => $unasOrderId]);
    }

    /**
     * Pushes a status change back to UNAS (e.g. after fulfillment). Not
     * needed for V1 (which only reads orders) but stubbed here since the
     * spec calls out "rendelés státusz import" as a required capability
     * and the read path and write path share the same auth/log/throttle
     * plumbing.
     */
    public function setOrderStatus(string $unasOrderId, string $status): array
    {
        return $this->request('POST', '/setOrderStatus', [
            'OrderId' => $unasOrderId,
            'Status' => $status,
        ]);
    }

    // -------------------------------------------------------------
    // Products / SKUs
    // -------------------------------------------------------------

    /**
     * Fetches product records including their variant/SKU breakdown
     * (UNAS represents e.g. shoe sizes as separate SKUs under one parent
     * product - see product_variants in the schema). Used by
     * cron/sync_unas_products.php.
     *
     * @param array{updatedSince?: string, limit?: int, offset?: int} $filters
     * @return array<int, array<string, mixed>>
     */
    public function getProducts(array $filters = []): array
    {
        return $this->request('POST', '/getProduct', $filters);
    }

    /**
     * Fetches current price for a single SKU. In practice this data
     * usually comes back as part of getProducts(); this method exists
     * for the case where a single-SKU price refresh is cheaper than a
     * full product re-fetch.
     */
    public function getSkuPrice(string $sku): array
    {
        return $this->request('POST', '/getProduct', ['Sku' => $sku]);
    }

    /**
     * Fetches current stock level for a single SKU (informational cache
     * only - real sellable-cost tracking is done via FIFO inventory_batches,
     * not this value).
     */
    public function getSkuStock(string $sku): array
    {
        return $this->request('POST', '/getStock', ['Sku' => $sku]);
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
        // UNAS expects XML request bodies. Kept as a single conversion
        // point so it's easy to adjust the root element name once
        // validated against the real API.
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
        $xml = simplexml_load_string($body);
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
