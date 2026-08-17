<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Pure pagination/offset math for cron/sync_unas_products.php's
 * --start-page/--start-offset resume support. No I/O - kept separate so
 * it can be unit tested without a database or a live API call, mirroring
 * UnasOrderMapper/UnasProductPriceMapper's role.
 *
 * Confirmed production scenario this exists for: a full catalog sync
 * fetched 200 pages (the default --limit-pages cap) of 50 products each
 * (10,000 records) and page 200 was STILL full, meaning the catalog has
 * more than 10,000 SKUs and the run stopped only because of the safety
 * cap, not because it reached the end. --start-page/--start-offset let a
 * follow-up run continue from where the previous one stopped instead of
 * re-fetching everything.
 */
final class UnasProductSyncPagination
{
    /**
     * Resolves the absolute UNAS LimitStart to begin this run at.
     *
     * --start-offset, when given, is used directly (it's already an
     * absolute LimitStart value). --start-page, when given instead, is
     * treated as "how many pages were already completed in a previous
     * run" - i.e. start_offset = start_page * pageSize. If both are
     * given, --start-offset takes precedence (it's the more precise,
     * unambiguous of the two). Neither given -> 0 (start from the
     * beginning of the catalog, the original default behavior).
     */
    public function resolveStartOffset(?int $startPage, ?int $startOffset, int $pageSize): int
    {
        if ($startOffset !== null) {
            return max(0, $startOffset);
        }

        if ($startPage !== null) {
            return max(0, $startPage) * $pageSize;
        }

        return 0;
    }

    /**
     * The UNAS LimitStart for the $localPageIndex-th page fetched by
     * THIS run (0-indexed: the first page fetched this run is index 0),
     * relative to $startOffset.
     */
    public function limitStartForLocalPage(int $startOffset, int $localPageIndex, int $pageSize): int
    {
        return $startOffset + ($localPageIndex * $pageSize);
    }

    /**
     * The 1-indexed "logical" page number to display for a given
     * LimitStart, consistent across runs regardless of --start-page/
     * --start-offset - e.g. LimitStart=10000 with pageSize=50 is always
     * "Page 201", whether this run started at offset 0 and got there on
     * its 201st fetch, or was resumed with --start-offset=10000 and it's
     * this run's very first fetch.
     */
    public function logicalPageNumber(int $limitStart, int $pageSize): int
    {
        return intdiv($limitStart, $pageSize) + 1;
    }
}
