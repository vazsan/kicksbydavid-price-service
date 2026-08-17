<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;

/**
 * Read/write access to `sync_logs` - one row per cron job run. Doubles
 * as the cron lock mechanism: a RUNNING row younger than the stale
 * threshold means another instance of the same job is presumed to still
 * be in progress, so a second invocation should refuse to start (see
 * findActiveRun()).
 */
final class SyncLogRepository
{
    /**
     * Starts a new run and returns its id. Callers must call finish()
     * exactly once, even on failure (wrap the run body in try/finally).
     */
    public function start(string $jobName): int
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO sync_logs (job_name, status, started_at, created_at)
             VALUES (:job_name, \'RUNNING\', NOW(), NOW())'
        );
        $stmt->execute(['job_name' => $jobName]);

        return (int) Database::connection()->lastInsertId();
    }

    public function finish(int $id, string $status, int $recordsProcessed, int $recordsFailed, ?string $errorMessage): void
    {
        $stmt = Database::connection()->prepare(
            'UPDATE sync_logs
             SET status = :status,
                 finished_at = NOW(),
                 records_processed = :processed,
                 records_failed = :failed,
                 error_message = :error
             WHERE id = :id'
        );
        $stmt->execute([
            'status' => $status,
            'processed' => $recordsProcessed,
            'failed' => $recordsFailed,
            'error' => $errorMessage === null ? null : mb_substr($errorMessage, 0, 4000),
            'id' => $id,
        ]);
    }

    /**
     * Returns the most recent still-RUNNING row for this job if it
     * started less than $staleAfterMinutes ago, or null if there is no
     * such lock (either no RUNNING row, or the only one is old enough to
     * assume its process died without calling finish()).
     *
     * @return array<string, mixed>|null
     */
    public function findActiveRun(string $jobName, int $staleAfterMinutes = 60): ?array
    {
        $stmt = Database::connection()->prepare(
            "SELECT * FROM sync_logs
             WHERE job_name = :job_name
               AND status = 'RUNNING'
               AND started_at > (NOW() - INTERVAL :stale_minutes MINUTE)
             ORDER BY id DESC
             LIMIT 1"
        );
        $stmt->execute(['job_name' => $jobName, 'stale_minutes' => $staleAfterMinutes]);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }
}
