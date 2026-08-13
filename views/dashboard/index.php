<?php
/** @var \App\Helpers\DateRange $range */
/** @var array $kpi */
/** @var array $series */
/** @var string $baseCurrency */
/** @var bool $hasData */

$presetLabels = [
    'today' => 'Today',
    'yesterday' => 'Yesterday',
    '7d' => 'Last 7 days',
    '30d' => 'Last 30 days',
    'this_month' => 'This month',
    'prev_month' => 'Previous month',
    'custom' => 'Custom range',
];
?>
<div class="page-header">
    <h1>Dashboard</h1>

    <form method="get" action="/dashboard" class="date-filter">
        <select name="range" onchange="this.form.submit()">
            <?php foreach ($presetLabels as $value => $label): ?>
                <option value="<?= e($value) ?>" <?= $range->preset === $value ? 'selected' : '' ?>><?= e($label) ?></option>
            <?php endforeach; ?>
        </select>
        <input type="date" name="from" value="<?= e($range->from) ?>">
        <input type="date" name="to" value="<?= e($range->to) ?>">
        <button type="submit" class="btn btn-secondary">Apply</button>
    </form>
</div>

<?php if (!$hasData): ?>
    <div class="alert alert-info">
        No aggregated data yet for this range. Run the UNAS sync and
        <code>cron/recalculate_profit.php</code> to populate the dashboard.
    </div>
<?php endif; ?>

<section class="kpi-grid">
    <div class="kpi-card">
        <span class="kpi-label">Revenue</span>
        <span class="kpi-value"><?= money($kpi['revenue'], $baseCurrency) ?></span>
    </div>
    <div class="kpi-card">
        <span class="kpi-label">Orders</span>
        <span class="kpi-value"><?= (int) $kpi['orders'] ?></span>
    </div>
    <div class="kpi-card">
        <span class="kpi-label">AOV</span>
        <span class="kpi-value"><?= $kpi['aov'] === null ? '—' : money($kpi['aov'], $baseCurrency) ?></span>
    </div>
    <div class="kpi-card">
        <span class="kpi-label">Ad Spend</span>
        <span class="kpi-value"><?= money($kpi['ad_spend'], $baseCurrency) ?></span>
    </div>
    <div class="kpi-card">
        <span class="kpi-label">ROAS</span>
        <span class="kpi-value"><?= $kpi['roas'] === null ? '—' : number_format($kpi['roas'], 2) ?></span>
    </div>
    <div class="kpi-card">
        <span class="kpi-label">MER</span>
        <span class="kpi-value"><?= $kpi['mer'] === null ? '—' : number_format($kpi['mer'], 2) ?></span>
    </div>
    <div class="kpi-card">
        <span class="kpi-label">Gross Profit</span>
        <span class="kpi-value"><?= money($kpi['gross_profit'], $baseCurrency) ?></span>
    </div>
    <div class="kpi-card">
        <span class="kpi-label">Contribution Profit</span>
        <span class="kpi-value"><?= money($kpi['contribution_profit'], $baseCurrency) ?></span>
    </div>
    <div class="kpi-card">
        <span class="kpi-label">Profit Margin</span>
        <span class="kpi-value"><?= $kpi['profit_margin_percent'] === null ? '—' : percent($kpi['profit_margin_percent']) ?></span>
    </div>
    <div class="kpi-card">
        <span class="kpi-label">COGS</span>
        <span class="kpi-value"><?= money($kpi['cogs'], $baseCurrency) ?></span>
    </div>
</section>

<section class="needs-attention">
    <h2>Needs Attention</h2>
    <p class="muted">Rule-based alerts will appear here once product-level profit and CPA data are available (V4/V5).</p>
</section>

<section class="charts-grid">
    <div class="chart-card">
        <h3>Revenue &amp; Profit over time</h3>
        <canvas id="chart-revenue-profit" height="90"></canvas>
    </div>
    <div class="chart-card">
        <h3>Orders over time</h3>
        <canvas id="chart-orders" height="90"></canvas>
    </div>
    <div class="chart-card">
        <h3>Ad Spend over time</h3>
        <canvas id="chart-ad-spend" height="90"></canvas>
    </div>
</section>

<script>
    window.__dashboardSeries = <?= json_encode($series, JSON_UNESCAPED_UNICODE) ?>;
</script>
<script src="/assets/js/dashboard.js"></script>
