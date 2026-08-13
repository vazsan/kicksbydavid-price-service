<?php

declare(strict_types=1);

namespace App\Helpers;

/**
 * File-backed sliding-window rate limiter.
 *
 * UNAS (and later Meta/Google) enforce a requests-per-minute cap. Cron
 * jobs run as separate PHP processes, so an in-memory counter would reset
 * every run; instead we persist recent request timestamps to a small
 * JSON file under storage/cache and self-throttle (sleep) when the
 * configured limit would be exceeded. This is best-effort, not a
 * distributed lock - fine for a single-server cPanel cron setup.
 */
final class RateLimiter
{
    public function __construct(
        private readonly string $cacheFile,
        private readonly int $maxRequestsPerMinute
    ) {
    }

    /**
     * Blocks (sleeps) if necessary, then records this request as having
     * happened now. Call immediately before firing the HTTP request.
     */
    public function throttle(): void
    {
        if ($this->maxRequestsPerMinute <= 0) {
            return;
        }

        $timestamps = $this->readTimestamps();
        $windowStart = microtime(true) - 60;
        $timestamps = array_values(array_filter($timestamps, static fn (float $t) => $t > $windowStart));

        if (count($timestamps) >= $this->maxRequestsPerMinute) {
            $oldest = min($timestamps);
            $sleepSeconds = max(0, ($oldest + 60) - microtime(true));
            if ($sleepSeconds > 0) {
                usleep((int) ceil($sleepSeconds * 1_000_000));
            }
            $windowStart = microtime(true) - 60;
            $timestamps = array_values(array_filter($timestamps, static fn (float $t) => $t > $windowStart));
        }

        $timestamps[] = microtime(true);
        $this->writeTimestamps($timestamps);
    }

    private function readTimestamps(): array
    {
        if (!is_file($this->cacheFile)) {
            return [];
        }

        $contents = @file_get_contents($this->cacheFile);
        $data = $contents ? json_decode($contents, true) : null;

        return is_array($data) ? $data : [];
    }

    private function writeTimestamps(array $timestamps): void
    {
        $dir = dirname($this->cacheFile);
        if (!is_dir($dir)) {
            @mkdir($dir, 0750, true);
        }

        @file_put_contents($this->cacheFile, json_encode($timestamps), LOCK_EX);
    }
}
