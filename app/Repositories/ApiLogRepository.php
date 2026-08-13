<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;

/**
 * Write-side access to api_logs. Read separately (Admin > API Logs) will
 * get its own query methods once that screen is built; V1 only needs to
 * write log rows from the API service clients.
 */
final class ApiLogRepository
{
    /**
     * @param string $provider  'UNAS' | 'META' | 'GOOGLE'
     */
    public function log(
        string $provider,
        string $endpoint,
        string $httpMethod,
        \DateTimeImmutable $requestTime,
        ?int $httpStatus,
        bool $isSuccess,
        ?int $durationMs,
        ?string $errorMessage
    ): void {
        $stmt = Database::connection()->prepare(
            'INSERT INTO api_logs
                (provider, endpoint, http_method, request_time, http_status, is_success, duration_ms, error_message, created_at)
             VALUES
                (:provider, :endpoint, :http_method, :request_time, :http_status, :is_success, :duration_ms, :error_message, NOW())'
        );

        $stmt->execute([
            'provider' => $provider,
            'endpoint' => $endpoint,
            'http_method' => $httpMethod,
            'request_time' => $requestTime->format('Y-m-d H:i:s'),
            'http_status' => $httpStatus,
            'is_success' => $isSuccess ? 1 : 0,
            'duration_ms' => $durationMs,
            // Truncate defensively - error_message is TEXT but no reason to store megabytes of HTML error pages.
            'error_message' => $errorMessage === null ? null : mb_substr($errorMessage, 0, 4000),
        ]);
    }
}
