<?php
/** @var \App\Helpers\DateRange $range */
/** @var string $shop */
/** @var string $currencyMode */
/** @var string $currency */
/** @var string $rateNote */
/** @var array $kpi */
/** @var array $table */
/** @var array $perShop */
/** @var array $costSettings */
/** @var ?string $lastCalculatedAt */
/** @var bool $hasData */



$presetLabels = [
    'today' => 'Ma',
    'yesterday' => 'Tegnap',
    '7d' => 'Utolsó 7 nap',
    '30d' => 'Utolsó 30 nap',
    'this_week' => 'Ez a hét',
    'prev_week' => 'Előző hét',
    'this_month' => 'Ez a hónap',
    'prev_month' => 'Előző hónap',
    'this_half' => 'Ez a félév',
    'prev_half' => 'Előző félév',
    'this_year' => 'Ez az év',
    'prev_year' => 'Előző év',
    'custom' => 'Egyedi időszak',
];
$groupLabels = ['day' => 'Naponta', 'week' => 'Hetente', 'month' => 'Havonta', 'half' => 'Félévente', 'year' => 'Évente'];
$dec = $currency === 'HUF' ? 0 : 2;
$fmt = static fn (?float $v): string => $v === null ? '—' : number_format($v, $dec, ',', ' ') . ' ' . $currency;
$pct = static fn (?float $v): string => $v === null ? '—' : number_format($v, 1, ',', ' ') . '%';
$setting = static function (string $key) use ($costSettings): ?string {
    $v = $costSettings[$key] ?? null;
    return ($v === null || trim($v) === '') ? null : trim($v);
};
$shopLabels = ['hu' => 'HU', 'sk' => 'SK', 'both' => 'Együtt'];
?>
<div class="page-header">
    <h1>Profit</h1>

    <form method="get" action="/dashboard" class="date-filter dash-filter">
        <select name="shop" aria-label="Bolt">
            <?php foreach (\App\Controllers\DashboardController::SHOPS as $value => $label): ?>
                <option value="<?= e($value) ?>" <?= $shop === $value ? 'selected' : '' ?>><?= e($label) ?></option>
            <?php endforeach; ?>
        </select>
        <select name="range" aria-label="Időszak">
            <?php foreach ($presetLabels as $value => $label): ?>
                <option value="<?= e($value) ?>" <?= $range->preset === $value ? 'selected' : '' ?>><?= e($label) ?></option>
            <?php endforeach; ?>
        </select>
        <select name="group" aria-label="Bontás">
            <?php foreach ($groupLabels as $value => $label): ?>
                <option value="<?= e($value) ?>" <?= $range->group === $value ? 'selected' : '' ?>><?= e($label) ?></option>
            <?php endforeach; ?>
        </select>
        <select name="cur" aria-label="Pénznem">
            <?php foreach (\App\Controllers\DashboardController::CURRENCIES as $value => $label): ?>
                <option value="<?= e($value) ?>" <?= $currencyMode === $value ? 'selected' : '' ?>><?= e($label) ?></option>
            <?php endforeach; ?>
        </select>
        <input type="date" name="from" value="<?= e($range->from) ?>" aria-label="Kezdő dátum" onchange="this.form.range.value='custom'">
        <input type="date" name="to" value="<?= e($range->to) ?>" aria-label="Záró dátum" onchange="this.form.range.value='custom'">
        <button type="submit" class="btn btn-secondary">Mutasd</button>
    </form>
</div>

<p class="muted dash-meta">
    <?= e($range->from) ?> – <?= e($range->to) ?> · <?= e(\App\Controllers\DashboardController::SHOPS[$shop]) ?> · <?= e($rateNote) ?>
    <?php if ($lastCalculatedAt !== null): ?> · utolsó számolás: <?= e($lastCalculatedAt) ?><?php endif; ?>
</p>

<?php if (!$hasData): ?>
    <div class="alert alert-info">Ebben az időszakban nincs rendelés (vagy még nem futott a profit-számolás).</div>
<?php endif; ?>

<?php if ($hasData && !$kpi['is_complete']): ?>
    <div class="alert alert-warning">
        A profit <strong>felső becslés</strong>: hiányzó költségek nincsenek levonva
        (<?= $kpi['cogs_units_total'] - $kpi['cogs_units_matched'] ?> termékdarabnak nincs Turum beszerzési ára,
        <?= $kpi['shipping_missing'] ?> rendelésnél hiányzik a szállítási díj, <?= $kpi['payment_missing'] ?> rendelésnél a fizetési díj).
        A teljesen lefedett rendelések külön sorban látszanak.
    </div>
<?php endif; ?>

<section class="kpi-grid">
    <div class="kpi-card">
        <span class="kpi-label">Bevétel (bruttó)</span>
        <span class="kpi-value"><?= $fmt($kpi['revenue']) ?></span>
        <span class="kpi-sub">nettó: <?= $fmt($kpi['net_revenue']) ?></span>
    </div>
    <div class="kpi-card">
        <span class="kpi-label">Rendelések</span>
        <span class="kpi-value"><?= (int) $kpi['orders'] ?></span>
        <span class="kpi-sub"><?= $kpi['orders_completed'] ?> lezárt · <?= $kpi['orders_open'] ?> folyamatban · <?= $kpi['orders_failed'] ?> sikertelen (nincs a bevételben)</span>
    </div>
    <div class="kpi-card">
        <span class="kpi-label">Átlagos kosár</span>
        <span class="kpi-value"><?= $fmt($kpi['aov']) ?></span>
        <span class="kpi-sub"><?= (int) $kpi['units'] ?> db termék</span>
    </div>
    <div class="kpi-card">
        <span class="kpi-label">Beszerzés (Turum)</span>
        <span class="kpi-value"><?= $fmt($kpi['cogs']) ?></span>
        <span class="kpi-sub">lefedettség: <?= $pct($kpi['cogs_coverage']) ?> (<?= $kpi['cogs_units_matched'] ?>/<?= $kpi['cogs_units_total'] ?> db)</span>
    </div>
    <div class="kpi-card">
        <span class="kpi-label">Szállítás (becsült)</span>
        <span class="kpi-value"><?= $fmt($kpi['shipping_cost']) ?></span>
        <span class="kpi-sub"><?= $kpi['shipping_missing'] > 0 ? $kpi['shipping_missing'] . ' rendelésnél nincs díj megadva' : 'minden rendelésre van díj' ?></span>
    </div>
    <div class="kpi-card">
        <span class="kpi-label">Fizetési díjak</span>
        <span class="kpi-value"><?= $fmt($kpi['payment_fees']) ?></span>
        <span class="kpi-sub"><?= $kpi['payment_missing'] > 0 ? $kpi['payment_missing'] . ' rendelésnél nincs díj megadva' : 'utánvét: a futár díjában' ?></span>
    </div>
    <div class="kpi-card kpi-card-strong">
        <span class="kpi-label">Profit (hirdetés előtt)</span>
        <span class="kpi-value"><?= $fmt($kpi['profit']) ?></span>
        <span class="kpi-sub">árrés: <?= $pct($kpi['margin']) ?><?= $kpi['is_complete'] ? '' : ' · felső becslés' ?></span>
    </div>
    <div class="kpi-card">
        <span class="kpi-label">Profit, teljesen lefedett rendelések</span>
        <span class="kpi-value"><?= $fmt($kpi['cogs_full_profit']) ?></span>
        <span class="kpi-sub"><?= $kpi['cogs_full_orders'] ?> rendelés, <?= $fmt($kpi['cogs_full_revenue']) ?> bevétel, árrés <?= $pct($kpi['cogs_full_margin']) ?></span>
    </div>
    <div class="kpi-card kpi-card-muted">
        <span class="kpi-label">Hirdetés</span>
        <span class="kpi-value">—</span>
        <span class="kpi-sub">még nincs bekötve (Meta / Google: F2)</span>
    </div>
</section>

<section class="dash-section">
    <h2>Boltonként (a kiválasztott időszakban)</h2>
    <table class="data-table data-table-stack">
        <thead>
        <tr><th>Bolt</th><th>Rendelés</th><th>Bevétel</th><th>Beszerzés</th><th>Lefedettség</th><th>Szállítás</th><th>Díjak</th><th>Profit</th></tr>
        </thead>
        <tbody>
        <?php foreach ($perShop as $s => $k): ?>
            <tr<?= $s === 'both' ? ' class="row-total"' : '' ?>>
                <td data-label="Bolt"><?= e($shopLabels[$s]) ?></td>
                <td data-label="Rendelés"><?= $k['orders'] ?><?= $k['orders_failed'] ? ' <span class="muted">(+' . $k['orders_failed'] . ' sikertelen)</span>' : '' ?></td>
                <td data-label="Bevétel"><?= $fmt($k['revenue']) ?></td>
                <td data-label="Beszerzés"><?= $fmt($k['cogs']) ?></td>
                <td data-label="Lefedettség"><?= $pct($k['cogs_coverage']) ?></td>
                <td data-label="Szállítás"><?= $fmt($k['shipping_cost']) ?><?= $k['shipping_missing'] ? ' <span class="muted">(' . $k['shipping_missing'] . ' hiányzik)</span>' : '' ?></td>
                <td data-label="Díjak"><?= $fmt($k['payment_fees']) ?><?= $k['payment_missing'] ? ' <span class="muted">(' . $k['payment_missing'] . ' hiányzik)</span>' : '' ?></td>
                <td data-label="Profit"><?= $fmt($k['profit']) ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
</section>

<section class="charts-grid">
    <div class="chart-card">
        <h3>Bevétel és profit (<?= e(mb_strtolower($groupLabels[$range->group])) ?>)</h3>
        <div class="chart-box"><canvas id="chart-revenue-profit"></canvas></div>
    </div>
    <div class="chart-card">
        <h3>Rendelések</h3>
        <div class="chart-box"><canvas id="chart-orders"></canvas></div>
    </div>
</section>

<section class="dash-section">
    <h2>Bontás: <?= e(mb_strtolower($groupLabels[$range->group])) ?></h2>
    <table class="data-table data-table-stack">
        <thead>
        <tr><th>Időszak</th><th>Rendelés</th><th>Bevétel</th><th>Beszerzés</th><th>Lefedettség</th><th>Szállítás + díjak</th><th>Profit</th><th>Árrés</th></tr>
        </thead>
        <tbody>
        <?php foreach ($table as $row): ?>
            <tr>
                <td data-label="Időszak"><?= e($row['label']) ?></td>
                <td data-label="Rendelés"><?= $row['orders'] ?></td>
                <td data-label="Bevétel"><?= $fmt($row['revenue']) ?></td>
                <td data-label="Beszerzés"><?= $fmt($row['cogs']) ?></td>
                <td data-label="Lefedettség"><?= $pct($row['cogs_coverage']) ?></td>
                <td data-label="Szállítás + díjak"><?= $fmt($row['shipping_cost'] + $row['payment_fees']) ?></td>
                <td data-label="Profit"><?= $fmt($row['profit']) ?></td>
                <td data-label="Árrés"><?= $pct($row['margin']) ?></td>
            </tr>
        <?php endforeach; ?>
        <?php if ($table === []): ?>
            <tr><td colspan="8" class="muted">Nincs adat.</td></tr>
        <?php endif; ?>
        </tbody>
    </table>
</section>

<section class="dash-section">
    <h2>Számítási feltevések</h2>
    <ul class="assumptions">
        <li><strong>Bevétel</strong>: az Unas rendelés végösszege (SumPriceGross), benne a vevő által fizetett szállítási és utánvét-kezelési díj; a sikertelen/törölt rendelés nincs benne. A nettó az Unas PriceNet összege; ahol a tétel ÁFA-kulcsa 0%, a bruttó és a nettó egyezik. Bruttó vagy nettó legyen-e az alap: döntésre vár.</li>
        <li><strong>Beszerzés</strong>: a Turum <em>mai</em> listaára (nem a valódi történeti beszerzési ár), párosítás: Unas cikkszám = Turum cikkszám + méret. Ahol nincs pár, ott nincs levonva semmi, és a lefedettség ezt mutatja.</li>
        <li><strong>Szállítás SK</strong>: DPD Pickup Export kedvezménykártya (2026.04.01-től, ÁFA nélkül), Szlovákia sor:
            <?= e($setting('shipping.sk.parcel_eur') ?? 'nincs megadva') ?> EUR/csomag (1-3 kg sáv) + <?= e($setting('shipping.sk.security_fee_eur') ?? '0') ?> EUR biztonsági díj,
            utánvétnél + <?= e($setting('shipping.sk.cod_fee_eur') ?? 'nincs megadva') ?> EUR COD-díj.
            Üzemanyag-pótlék: <?= $setting('shipping.sk.fuel_surcharge_pct') !== null ? e($setting('shipping.sk.fuel_surcharge_pct')) . '%' : '<strong>nincs megadva</strong> (havonta változik, dpd.com.pl)' ?>.
            DPD házhozszállítás: <?= $setting('shipping.sk.home_parcel_eur') !== null ? e($setting('shipping.sk.home_parcel_eur')) . ' EUR/csomag, <strong>ideiglenesen a Pickup kártya ára</strong> (a DPD Classic árlista nincs meg)' : '<strong>nincs megadva</strong>' ?>.</li>
        <li><strong>Szállítás HU (Packeta)</strong>: <?= $setting('shipping.hu.parcel_eur') !== null ? e($setting('shipping.hu.parcel_eur')) . ' EUR/csomag' : '<strong>HIÁNYZIK</strong> - a Packeta díjai még nincsenek megadva, ezért a HU profitból nincs levonva szállítási költség' ?>.</li>
        <li><strong>Fizetési díjak</strong>: kártyás díj <?= $setting('payment.card_pct') !== null ? e($setting('payment.card_pct')) . '%' : '<strong>nincs megadva</strong>' ?>, átutalás <?= e($setting('payment.transfer_eur') ?? 'nincs megadva') ?> EUR; utánvétnél a díj a futár COD-díjában van.</li>
        <li><strong>Hirdetési költés</strong>: még nincs bekötve (Meta és Google Ads: F2 fázis).</li>
    </ul>
</section>

<?php ini_set('serialize_precision', '-1'); // shortest float repr in the JSON below ?>
<script>
    window.__dashboardSeries = <?= json_encode(array_map(static fn ($r) => [
        'label' => $r['label'],
        'revenue' => round($r['revenue'], 2),
        'profit' => round($r['profit'], 2),
        'orders' => $r['orders'],
    ], $table), JSON_UNESCAPED_UNICODE) ?>;
    window.__dashboardCurrency = <?= json_encode($currency) ?>;
</script>
<?php $dashJs = dirname(__DIR__, 2) . '/public/assets/js/dashboard.js'; ?>
<script src="/assets/js/dashboard.js<?= is_file($dashJs) ? '?v=' . filemtime($dashJs) : '' ?>"></script>
