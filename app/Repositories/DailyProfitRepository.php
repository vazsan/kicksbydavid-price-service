<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;

/**
 * Reads the precomputed daily_profit cache table for dashboard KPIs and
 * charts. This table is populated by cron/recalculate_profit.php (a later
 * build step); until that job has run at least once it is simply empty,
 * and the dashboard renders a clean zero/empty state rather than erroring.
 */
final class DailyProfitRepository
{
    /**
     * Aggregated totals for the given inclusive date range.
     */
    public function totals(string $from, string $to): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT
                COALESCE(SUM(revenue), 0)              AS revenue,
                COALESCE(SUM(net_revenue), 0)           AS net_revenue,
                COALESCE(SUM(cogs), 0)                  AS cogs,
                COALESCE(SUM(gross_profit), 0)           AS gross_profit,
                COALESCE(SUM(ad_spend), 0)               AS ad_spend,
                COALESCE(SUM(payment_fees), 0)            AS payment_fees,
                COALESCE(SUM(shipping_cost), 0)            AS shipping_cost,
                COALESCE(SUM(contribution_profit), 0)       AS contribution_profit,
                COALESCE(SUM(orders_count), 0)               AS orders_count,
                COALESCE(SUM(units_sold), 0)                  AS units_sold
             FROM daily_profit
             WHERE stat_date BETWEEN :from AND :to'
        );
        $stmt->execute(['from' => $from, 'to' => $to]);

        return $stmt->fetch() ?: [];
    }

    /**
     * Day-by-day rows for the given range, used to feed the Chart.js
     * time series on the dashboard.
     */
    public function series(string $from, string $to): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT stat_date, revenue, contribution_profit, orders_count, ad_spend, cogs
             FROM daily_profit
             WHERE stat_date BETWEEN :from AND :to
             ORDER BY stat_date ASC'
        );
        $stmt->execute(['from' => $from, 'to' => $to]);

        return $stmt->fetchAll();
    }
}
