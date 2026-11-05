<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;

/**
 * Reads the precomputed daily_profit cache (one row per day x shop,
 * written by cron/recalculate_profit.php) for the dashboard.
 */
final class DailyProfitRepository
{
    /** Summable daily_profit columns the dashboard uses. */
    public const SUM_COLUMNS = [
        'revenue', 'net_revenue', 'merchandise_revenue', 'shipping_fee_charged', 'handling_fee_charged',
        'revenue_native', 'revenue_native_in_base', 'cogs', 'cogs_units_matched', 'cogs_units_total',
        'cogs_full_orders', 'cogs_full_revenue', 'cogs_full_profit', 'gross_profit', 'ad_spend',
        'payment_fees', 'payment_fee_missing_orders', 'shipping_cost', 'shipping_cost_missing_orders',
        'discount_total', 'contribution_profit', 'orders_count', 'orders_completed', 'orders_open',
        'orders_failed', 'failed_revenue', 'units_sold',
    ];

    /**
     * Day x shop rows in the inclusive range, optionally limited to the
     * given shops (e.g. ['hu']). Empty $shops = every shop.
     *
     * @param array<int, string> $shops
     * @return array<int, array<string, mixed>>
     */
    public function rows(string $from, string $to, array $shops = []): array
    {
        $sql = 'SELECT stat_date, shop, ' . implode(', ', self::SUM_COLUMNS) . ', calculated_at
                FROM daily_profit WHERE stat_date BETWEEN ? AND ?';
        $params = [$from, $to];
        if ($shops !== []) {
            $sql .= ' AND shop IN (' . implode(',', array_fill(0, count($shops), '?')) . ')';
            array_push($params, ...array_values($shops));
        }
        $stmt = Database::connection()->prepare($sql . ' ORDER BY stat_date, shop');
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    public function lastCalculatedAt(): ?string
    {
        $v = Database::connection()->query('SELECT MAX(calculated_at) FROM daily_profit')->fetchColumn();
        return $v === false || $v === null ? null : (string) $v;
    }
}
