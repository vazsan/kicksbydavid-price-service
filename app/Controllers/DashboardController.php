<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\App;
use App\Core\Auth;
use App\Core\View;
use App\Helpers\DateRange;
use App\Repositories\DailyProfitRepository;
use App\Repositories\SettingsRepository;

final class DashboardController
{
    public const SHOPS = ['both' => 'HU + SK', 'hu' => 'HU (kicksbydavid.hu)', 'sk' => 'SK (kicksbydavid.sk)'];
    public const CURRENCIES = ['EUR' => 'EUR', 'HUF370' => 'HUF (fix árfolyam)', 'HUFRATE' => 'HUF (Unas árfolyam)'];

    public function index(): void
    {
        Auth::requireLogin();

        $range = DateRange::fromRequest($_GET);
        $shop = array_key_exists($_GET['shop'] ?? '', self::SHOPS) ? (string) $_GET['shop'] : 'both';
        $currencyMode = array_key_exists($_GET['cur'] ?? '', self::CURRENCIES) ? (string) $_GET['cur'] : 'EUR';

        $repository = new DailyProfitRepository();
        $allRows = $repository->rows($range->from, $range->to);
        $rows = $shop === 'both' ? $allRows : array_values(array_filter($allRows, static fn ($r) => $r['shop'] === $shop));

        $settings = new SettingsRepository();
        $fixedRate = (float) ($settings->get('fx.huf_per_eur_display', '370') ?: 370);
        [$factor, $currencyLabel, $rateNote] = $this->currency($currencyMode, $allRows, $fixedRate);

        $totals = $this->sum($rows);
        $buckets = [];
        foreach ($rows as $r) {
            $key = $range->bucketKey((string) $r['stat_date']);
            $buckets[$key][] = $r;
        }
        ksort($buckets);
        $table = [];
        foreach ($buckets as $key => $bucketRows) {
            $table[] = ['key' => $key, 'label' => DateRange::bucketLabel($key, $range->group)] + $this->kpis($this->sum($bucketRows), $factor);
        }
        $perShop = [];
        foreach (['hu', 'sk'] as $s) {
            $perShop[$s] = $this->kpis($this->sum(array_filter($allRows, static fn ($r) => $r['shop'] === $s)), $factor);
        }
        $perShop['both'] = $this->kpis($this->sum(array_filter($allRows, static fn ($r) => in_array($r['shop'], ['hu', 'sk'], true))), $factor);

        View::renderWithLayout('dashboard.index', [
            'title' => 'Profit',
            'range' => $range,
            'shop' => $shop,
            'currencyMode' => $currencyMode,
            'currency' => $currencyLabel,
            'rateNote' => $rateNote,
            'kpi' => $this->kpis($totals, $factor),
            'table' => $table,
            'perShop' => $perShop,
            'costSettings' => $this->costSettings(),
            'lastCalculatedAt' => $repository->lastCalculatedAt(),
            'hasData' => $rows !== [],
        ]);
    }

    /**
     * @return array{0: float, 1: string, 2: string} factor applied to EUR amounts, label, explanation
     */
    private function currency(string $mode, array $rows, float $fixedRate): array
    {
        if ($mode === 'HUF370') {
            return [$fixedRate, 'HUF', sprintf('EUR x %s', rtrim(rtrim(number_format($fixedRate, 3, '.', ''), '0'), '.'))];
        }
        if ($mode === 'HUFRATE') {
            $native = array_sum(array_map(static fn ($r) => (float) $r['revenue_native'], $rows));
            $base = array_sum(array_map(static fn ($r) => (float) $r['revenue_native_in_base'], $rows));
            if ($base > 0) {
                $rate = $native / $base;
                return [$rate, 'HUF', sprintf('az időszak HU rendeléseinek Unas-árfolyama: %.2f HUF/EUR', $rate)];
            }
            return [$fixedRate, 'HUF', sprintf('nincs HU rendelés az időszakban, ezért fix %.0f HUF/EUR', $fixedRate)];
        }
        return [1.0, 'EUR', 'HUF rendelések a rendelésenkénti Unas-árfolyammal EUR-ra váltva'];
    }

    /** @param iterable<array<string, mixed>> $rows */
    private function sum(iterable $rows): array
    {
        $t = array_fill_keys(DailyProfitRepository::SUM_COLUMNS, 0.0);
        foreach ($rows as $r) {
            foreach (DailyProfitRepository::SUM_COLUMNS as $c) {
                $t[$c] += (float) $r[$c];
            }
        }
        return $t;
    }

    /**
     * Display KPIs from summed daily_profit columns. Money is multiplied by
     * $factor (1 for EUR). Ratios are null when undefined (shown as "-").
     */
    private function kpis(array $t, float $factor): array
    {
        $m = static fn (float $v): float => $v * $factor;
        $orders = (int) $t['orders_count'];
        $unitsTotal = (int) $t['cogs_units_total'];
        $fullRevenue = (float) $t['cogs_full_revenue'];

        return [
            'revenue' => $m($t['revenue']),
            'net_revenue' => $m($t['net_revenue']),
            'merchandise_revenue' => $m($t['merchandise_revenue']),
            'shipping_fee_charged' => $m($t['shipping_fee_charged']),
            'handling_fee_charged' => $m($t['handling_fee_charged']),
            'orders' => $orders,
            'orders_completed' => (int) $t['orders_completed'],
            'orders_open' => (int) $t['orders_open'],
            'orders_failed' => (int) $t['orders_failed'],
            'failed_revenue' => $m($t['failed_revenue']),
            'aov' => $orders > 0 ? $m($t['revenue']) / $orders : null,
            'units' => (int) $t['units_sold'],
            'cogs' => $m($t['cogs']),
            'cogs_units_matched' => (int) $t['cogs_units_matched'],
            'cogs_units_total' => $unitsTotal,
            'cogs_coverage' => $unitsTotal > 0 ? $t['cogs_units_matched'] / $unitsTotal * 100 : null,
            'cogs_full_orders' => (int) $t['cogs_full_orders'],
            'cogs_full_revenue' => $m($fullRevenue),
            'cogs_full_profit' => $m($t['cogs_full_profit']),
            'cogs_full_margin' => $fullRevenue > 0 ? $t['cogs_full_profit'] / $fullRevenue * 100 : null,
            'shipping_cost' => $m($t['shipping_cost']),
            'shipping_missing' => (int) $t['shipping_cost_missing_orders'],
            'payment_fees' => $m($t['payment_fees']),
            'payment_missing' => (int) $t['payment_fee_missing_orders'],
            'profit' => $m($t['contribution_profit']),
            'margin' => $t['revenue'] > 0 ? $t['contribution_profit'] / $t['revenue'] * 100 : null,
            'is_complete' => $unitsTotal > 0 && (int) $t['cogs_units_matched'] >= $unitsTotal
                && (int) $t['shipping_cost_missing_orders'] === 0 && (int) $t['payment_fee_missing_orders'] === 0,
        ];
    }

    /** @return array<string, ?string> profit_costs settings for the assumptions box */
    private function costSettings(): array
    {
        $stmt = \App\Core\Database::connection()->query(
            "SELECT setting_key, setting_value FROM settings WHERE setting_group = 'profit_costs' ORDER BY setting_key"
        );
        $out = [];
        foreach ($stmt->fetchAll() as $r) {
            $out[$r['setting_key']] = $r['setting_value'];
        }
        return $out;
    }
}
