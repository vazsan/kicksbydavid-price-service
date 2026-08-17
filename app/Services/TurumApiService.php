<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Logger;
use App\Helpers\RateLimiter;
use App\Repositories\ApiLogRepository;

/**
 * Client for the Turum B2B supplier API (https://api.b2b.turum.pl).
 *
 * STATUS: skeleton for Phase 1 diagnostics only (scripts/test_turum_
 * connection.php). No product/order sync uses this yet - see
 * ARCHITECTURE.md "Turum integration status" for what's confirmed vs.
 * still unknown, and for the planned split between CURRENT supplier
 * price (from getProductsFullList()) and HISTORICAL purchase cost (from
 * a reservation's item_price via getReservationDetail()) - do not use
 * one for the other's purpose once sync logic is built.
 *
 * Confirmed protocol (per the project owner's OpenAPI spec extract -
 * this class does not have direct access to that spec file, only what
 * was reported; anything not listed here is unconfirmed, see below):
 *   - Base URL: https://api.b2b.turum.pl , JSON request/response bodies
 *     (not XML, unlike UnasApiService).
 *   - Auth: POST /v1/account/login with JSON {"username":..,"password":..},
 *     response has access_token + token_type. Documented as valid 24
 *     hours; no expiry field is confirmed in the response itself, so the
 *     expiry used here is a computed now+24h, not read from the API -
 *     see authenticate(). Subsequent requests send
 *     "Authorization: Bearer {access_token}".
 *   - GET /v1/account/me - account metadata.
 *   - GET /v1/products_full_list_new - full product catalog.
 *     CONFIRMED HARD LIMIT: the docs explicitly say do not send more
 *     than 1 request per minute to this endpoint - enforced here via a
 *     dedicated RateLimiter instance (PRODUCTS_FULL_LIST_MAX_PER_MINUTE),
 *     separate from the general per-minute limiter used for other
 *     endpoints, so a burst of other calls never eats into this budget
 *     or vice versa.
 *   - GET /v1/reservations - reservation list.
 *   - GET /v1/reservation/{id} - one reservation's detail, including
 *     reservation_items (the confirmed source of historical item_price).
 *
 * NOT confirmed / not implemented here - do not guess:
 *   - POST /v1/products/check_stocks_and_prices - confirmed to exist,
 *     not implemented (no diagnostic use for it yet).
 *   - The exact response JSON structure beyond the top-level fields the
 *     project owner listed (see ARCHITECTURE.md) - e.g. whether
 *     /v1/reservations is paginated via a "limit" query param is an
 *     assumption (a common REST convention), not confirmed.
 *   - The currency of variant `price` - documented only as "Price of the
 *     product variant", not tied to a currency here.
 */
final class TurumApiService
{
    private const PROVIDER = 'TURUM';

    /**
     * Confirmed hard API rule (Turum docs): never more than 1 request
     * per minute to /v1/products_full_list_new.
     */
    private const PRODUCTS_FULL_LIST_MAX_PER_MINUTE = 1;

    private ?string $token = null;
    private ?\DateTimeImmutable $tokenExpiresAt = null;

    /** Set on every request() call; read by diagnostics, never by business logic. */
    private ?int $lastHttpStatus = null;
    private string $lastRawResponseBody = '';

    private readonly RateLimiter $rateLimiter;
    private readonly RateLimiter $productsFullListRateLimiter;
    private readonly ApiLogRepository $apiLog;

    public function __construct(
        private readonly string $username,
        private readonly string $password,
        private readonly string $baseUrl,
        int $rateLimitPerMinute,
        ?string $rateLimiterCacheFile = null,
        ?string $productsFullListRateLimiterCacheFile = null
    ) {
        $this->rateLimiter = new RateLimiter(
            $rateLimiterCacheFile ?? dirname(__DIR__, 2) . '/storage/cache/turum_rate_limit.json',
            $rateLimitPerMinute
        );
        $this->productsFullListRateLimiter = new RateLimiter(
            $productsFullListRateLimiterCacheFile ?? dirname(__DIR__, 2) . '/storage/cache/turum_products_full_list_rate_limit.json',
            self::PRODUCTS_FULL_LIST_MAX_PER_MINUTE
        );
        $this->apiLog = new ApiLogRepository();
    }

    // -------------------------------------------------------------
    // Authentication
    // -------------------------------------------------------------

    public function authenticate(): void
    {
        if ($this->username === '' || $this->password === '') {
            throw new \RuntimeException('TURUM_USERNAME/TURUM_PASSWORD are not configured. Set them in .env.');
        }

        $response = $this->request('POST', '/v1/account/login', [
            'username' => $this->username,
            'password' => $this->password,
        ], authenticated: false);

        $token = $response['access_token'] ?? null;

        if (!is_string($token) || $token === '') {
            throw new \RuntimeException('Turum authentication did not return an access_token.');
        }

        $this->token = $token;
        // Docs state 24h validity; no expiry field is confirmed in the
        // response, so this is computed, not parsed - if a future
        // sample turns out to include e.g. "expires_in" or "expires_at",
        // prefer that over this fixed assumption (see class docblock).
        $this->tokenExpiresAt = (new \DateTimeImmutable())->modify('+24 hours');
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
    // Confirmed endpoints
    // -------------------------------------------------------------

    /**
     * @return array<string, mixed>
     */
    public function getAccountMe(): array
    {
        return $this->request('GET', '/v1/account/me');
    }

    /**
     * Fetches the FULL product catalog in one call. Confirmed hard rule:
     * never more than 1 request/minute to this endpoint - enforced via
     * $this->productsFullListRateLimiter, not the general limiter.
     * Callers must not loop/paginate this themselves without first
     * confirming (from a real response) whether pagination even applies
     * here - the endpoint name ("full_list") suggests it may not.
     *
     * @return array<string, mixed>
     */
    public function getProductsFullList(): array
    {
        return $this->request('GET', '/v1/products_full_list_new', [], true, useProductsFullListRateLimit: true);
    }

    /**
     * @param array<string, mixed> $params Query params, e.g. a page-size
     *     filter - exact accepted param names are NOT confirmed (see
     *     class docblock); pass whatever the caller wants to try.
     * @return array<string, mixed>
     */
    public function getReservations(array $params = []): array
    {
        return $this->request('GET', '/v1/reservations', $params);
    }

    /**
     * @return array<string, mixed>
     */
    public function getReservationDetail(string $reservationId): array
    {
        return $this->request('GET', '/v1/reservation/' . rawurlencode($reservationId));
    }

    // -------------------------------------------------------------
    // Diagnostics
    // -------------------------------------------------------------

    public function lastHttpStatus(): ?int
    {
        return $this->lastHttpStatus;
    }

    /**
     * Raw (undecoded) JSON body of the most recent request() call,
     * success or failure - needed for diagnostics to inspect the real
     * response shape. See scripts/test_turum_connection.php.
     */
    public function lastRawResponseBody(): string
    {
        return $this->lastRawResponseBody;
    }

    // -------------------------------------------------------------
    // Low-level request pipeline
    // -------------------------------------------------------------

    /**
     * @param array<string, mixed> $params For GET, sent as a query string;
     *     for POST, sent as a JSON request body.
     * @return array<string, mixed> Decoded response body.
     */
    private function request(
        string $method,
        string $endpoint,
        array $params = [],
        bool $authenticated = true,
        bool $useProductsFullListRateLimit = false
    ): array {
        if ($authenticated) {
            $this->ensureAuthenticated();
        }

        ($useProductsFullListRateLimit ? $this->productsFullListRateLimiter : $this->rateLimiter)->throttle();

        $method = strtoupper($method);
        $url = $this->baseUrl . $endpoint;
        $postFields = null;

        if ($method === 'GET') {
            if ($params !== []) {
                $url .= '?' . http_build_query($params);
            }
        } else {
            $postFields = json_encode($params, JSON_UNESCAPED_UNICODE) ?: '{}';
        }

        $startedAt = new \DateTimeImmutable();
        $startedAtMicro = microtime(true);
        $httpStatus = null;
        $errorMessage = null;
        $body = '';

        $curlOptions = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $this->buildHeaders($authenticated),
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
        ];
        if ($postFields !== null) {
            $curlOptions[CURLOPT_POSTFIELDS] = $postFields;
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, $curlOptions);

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

        // Never log the username/password/token, even on failure.
        $this->apiLog->log(self::PROVIDER, $endpoint, $method, $startedAt, $httpStatus, $isSuccess, $durationMs, $errorMessage);

        if (!$isSuccess) {
            Logger::error('turum_api', "Request to {$endpoint} failed", [
                'http_status' => $httpStatus,
                'error' => $errorMessage,
            ]);
            throw new \RuntimeException("Turum API request to {$endpoint} failed: {$errorMessage}");
        }

        return $this->decodeBody($body);
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeBody(string $body): array
    {
        if (trim($body) === '') {
            return [];
        }

        $decoded = json_decode($body, true);

        if (!is_array($decoded)) {
            throw new \RuntimeException('Turum API returned malformed or non-object JSON.');
        }

        return $decoded;
    }

    /**
     * @return array<int, string>
     */
    private function buildHeaders(bool $authenticated): array
    {
        $headers = ['Content-Type: application/json', 'Accept: application/json'];

        if ($authenticated && $this->token !== null) {
            $headers[] = "Authorization: Bearer {$this->token}";
        }

        return $headers;
    }
}
