<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\App;
use App\Core\Auth;
use App\Core\View;
use App\Helpers\DateRange;
use App\Repositories\DailyProfitRepository;

final class DashboardController
{
    public function index(): void
    {
        Auth::requireLogin();

        $range = DateRange::fromRequest($_GET);
        $repository = new DailyProfitRepository();
        $totals = $repository->totals($range->from, $range->to);
        $series = $repository->series($range->from, $range->to);

        View::renderWithLayout('dashboard.index', [
            'title' => 'Dashboard',
            'range' => $range,
            'kpi' => $this->buildKpis($totals),
            'series' => $series,
            'baseCurrency' => App::config('app.base_currency'),
            'hasData' => ((int) ($totals['orders_count'] ?? 0)) > 0,
        ]);
    }

    /**
     * Derives the display KPIs from the raw daily_profit sums. Divisions
     * are guarded against zero so an empty/early-stage shop just shows
     * "-" instead of a division-by-zero warning.
     */
    private function buildKpis(array $totals): array
    {
        $revenue = (float) ($totals['revenue'] ?? 0);
        $orders = (int) ($totals['orders_count'] ?? 0);
        $adSpend = (float) ($totals['ad_spend'] ?? 0);
        $grossProfit = (float) ($totals['gross_profit'] ?? 0);
        $contributionProfit = (float) ($totals['contribution_profit'] ?? 0);
        $cogs = (float) ($totals['cogs'] ?? 0);

        return [
            'revenue' => $revenue,
            'orders' => $orders,
            'aov' => $orders > 0 ? $revenue / $orders : null,
            'ad_spend' => $adSpend,
            'roas' => $adSpend > 0 ? $revenue / $adSpend : null,
            'mer' => $adSpend > 0 ? $revenue / $adSpend : null, // MER = blended ROAS at shop level.
            'gross_profit' => $grossProfit,
            'contribution_profit' => $contributionProfit,
            'profit_margin_percent' => $revenue > 0 ? ($contributionProfit / $revenue) * 100 : null,
            'cogs' => $cogs,
            'units_sold' => (int) ($totals['units_sold'] ?? 0),
        ];
    }
}
