<?php

declare(strict_types=1);

require __DIR__ . '/../app/Core/Autoloader.php';
require __DIR__ . '/TestKit.php';

\App\Core\Autoloader::register('App', __DIR__ . '/../app');

use App\Services\ProfitCalculator;

$t = new TestKit('ProfitCalculator');
$near = static fn (float $a, float $b): bool => abs($a - $b) < 0.005;

$settings = [
    'fx.huf_per_eur_display' => '370',
    'shipping.sk.parcel_eur' => '2.98',
    'shipping.sk.home_parcel_eur' => '2.98',
    'shipping.sk.security_fee_eur' => '0.45',
    'shipping.sk.fuel_surcharge_pct' => '',
    'shipping.sk.cod_fee_eur' => '7.30',
    'shipping.hu.parcel_eur' => '',
    'shipping.hu.cod_fee_eur' => '',
    'payment.card_pct' => '',
    'payment.card_fixed_eur' => '',
    'payment.transfer_eur' => '0',
];
$c = new ProfitCalculator($settings, 'EUR');

// --- status buckets ---
$t->assertSame('completed', $c->statusBucket('close_ok', 'Megrendelés lezárva'), 'close_ok -> completed');
$t->assertSame('open', $c->statusBucket('open_normal', 'Elindult a rendelésed'), 'open_* -> open');
$t->assertSame('failed', $c->statusBucket('close_fault', 'Sikertelen kézbesítés'), 'close_fault -> failed');
$t->assertSame('failed', $c->statusBucket('open_normal', 'Törölt rendelés'), 'a "Törölt" label is failed whatever the type');

// --- FX: HUF uses the order's own ExchangeValue ---
$t->assertTrue($near($c->fxDivisor(['currency' => 'HUF', 'unas_exchange_value' => '368.659']), 368.659), 'HUF divisor = ExchangeValue');
$t->assertTrue($near($c->fxDivisor(['currency' => 'EUR', 'unas_exchange_value' => null]), 1.0), 'EUR divisor = 1');
$t->assertTrue($near($c->fxDivisor(['currency' => 'HUF', 'unas_exchange_value' => null, 'exchange_rate_to_base' => '1.000000']), 370.0), 'HUF with no rate falls back to the display rate, never 1.0');

// --- shipping ---
$sk = $c->shippingCost(['shop' => 'sk', 'payment_method' => 'cod']);
$t->assertTrue($near((float) $sk['cost'], 2.98 + 0.45 + 7.30) && $sk['missing'] === false, 'SK COD parcel = DPD 1-3kg + security fee + COD fee');
$sk2 = $c->shippingCost(['shop' => 'sk', 'payment_method' => 'card']);
$t->assertTrue($near((float) $sk2['cost'], 3.43), 'SK prepaid parcel = DPD 1-3kg + security fee');
$hu = $c->shippingCost(['shop' => 'hu', 'payment_method' => 'cod']);
$t->assertTrue($hu['cost'] === null && $hu['missing'] === true, 'HU (Packeta) cost not provided -> null + missing, not 0');

// --- payment fees ---
$t->assertSame(['cost' => 0.0, 'missing' => false], $c->paymentFee(['payment_method' => 'cod'], 100), 'COD has no separate provider fee');
$t->assertSame(['cost' => null, 'missing' => true], $c->paymentFee(['payment_method' => 'card'], 100), 'card fee not provided -> missing');
$t->assertSame(['cost' => null, 'missing' => true], $c->paymentFee(['payment_method' => 'bankcard', 'payment_name' => 'Stripe-Biztonságos Bankkártyás fizetés'], 100), 'live Stripe "bankcard" is a card payment, not a bank transfer');
$t->assertSame(['cost' => 0.0, 'missing' => false], $c->paymentFee(['payment_method' => 'transfer', 'payment_name' => 'Banki átutalás'], 100), 'bank transfer uses payment.transfer_eur');
$t->assertSame(['cost' => null, 'missing' => true], $c->paymentFee(['payment_method' => 'other', 'payment_name' => 'Valami új'], 100), 'unknown method -> missing');

// --- COD by payment name (live: Type "other", Name "Utánvét (+1.100 ft)") and home delivery ---
$t->assertTrue($c->isCod(['payment_method' => 'other', 'payment_name' => 'Utánvét (+1.100 ft)']), 'COD detected from the payment name');
$t->assertTrue(!$c->isCod(['payment_method' => 'bankcard', 'payment_name' => 'Stripe-Biztonságos Bankkártyás fizetés']), 'Stripe card is not COD');
$t->assertTrue($c->isHomeDelivery(['shipping_method' => 'DPD HÁZHOZSZÁLLITÁS']), 'DPD home delivery detected');
$t->assertTrue(!$c->isHomeDelivery(['shipping_method' => 'DPD csomagpontok']), 'DPD pickup point is not home delivery');
$noHome = new ProfitCalculator(['shipping.sk.parcel_eur' => '2.98', 'shipping.sk.home_parcel_eur' => ''], 'EUR');
$t->assertSame(['cost' => null, 'missing' => true], $noHome->shippingCost(['shop' => 'sk', 'shipping_method' => 'DPD HÁZHOZSZÁLLITÁS']), 'home delivery without its own price -> missing');

// --- aggregation ---
$orders = [
    // HU, HUF 43465 @ 368.659, closed, 1/1 unit costed 60 EUR
    ['order_date' => '2026-10-04 13:39:02', 'shop' => 'hu', 'currency' => 'HUF', 'unas_exchange_value' => '368.659', 'exchange_rate_to_base' => '0.002713',
     'grand_total' => '43465', 'grand_total_net' => '43465', 'subtotal' => '40183.831', 'shipping_fee_charged' => '2211.95', 'discount_total' => '0',
     'handling_total' => '1069', 'status_type' => 'close_ok', 'status' => 'Megrendelés lezárva', 'payment_method' => 'cod',
     'units_total' => 1, 'units_matched' => 1, 'cogs_matched' => '60'],
    // SK, EUR 120, open, card, 0/1 unit costed
    ['order_date' => '2026-10-04 18:00:00', 'shop' => 'sk', 'currency' => 'EUR', 'unas_exchange_value' => null, 'exchange_rate_to_base' => '1',
     'grand_total' => '120', 'grand_total_net' => '120', 'subtotal' => '115', 'shipping_fee_charged' => '5', 'discount_total' => '0',
     'handling_total' => '0', 'status_type' => 'open_normal', 'status' => 'Feldolgozás alatt', 'payment_method' => 'card',
     'units_total' => 1, 'units_matched' => 0, 'cogs_matched' => '0'],
    // SK failed - excluded from revenue
    ['order_date' => '2026-10-04 19:00:00', 'shop' => 'sk', 'currency' => 'EUR', 'unas_exchange_value' => null, 'exchange_rate_to_base' => '1',
     'grand_total' => '80', 'grand_total_net' => '80', 'subtotal' => '80', 'shipping_fee_charged' => '0', 'discount_total' => '0',
     'handling_total' => '0', 'status_type' => 'close_fault', 'status' => 'Sikertelen', 'payment_method' => 'cod',
     'units_total' => 1, 'units_matched' => 1, 'cogs_matched' => '50'],
];
$rows = $c->aggregate($orders);
$t->assertSame(['2026-10-04|hu', '2026-10-04|sk'], array_keys($rows), 'one row per day x shop');
$hu = $rows['2026-10-04|hu'];
$t->assertTrue($near($hu['revenue'], 43465 / 368.659), 'HU revenue converted with the order ExchangeValue (~117.90 EUR)');
$t->assertTrue($near($hu['cogs'], 60.0) && $hu['cogs_units_matched'] === 1, 'HU COGS from the Turum snapshot');
$t->assertSame(1, $hu['shipping_cost_missing_orders'], 'HU Packeta cost flagged missing');
$t->assertTrue($near($hu['contribution_profit'], 43465 / 368.659 - 60), 'HU profit = revenue - COGS (missing costs not invented)');
$t->assertSame(1, $hu['cogs_full_orders'], 'HU order is fully costed');
$t->assertTrue($near($hu['revenue_native'], 43465.0), 'native HUF revenue kept for the HUF display mode');
$t->assertTrue($near($hu['handling_fee_charged'], 1069 / 368.659), 'COD handling fee paid by the customer converted to EUR');
$sk = $rows['2026-10-04|sk'];
$t->assertSame(1, $sk['orders_count'], 'failed SK order is not counted as an order');
$t->assertSame(1, $sk['orders_failed'], 'failed SK order counted separately');
$t->assertTrue($near($sk['failed_revenue'], 80.0), 'failed revenue tracked separately');
$t->assertTrue($near($sk['revenue'], 120.0), 'SK revenue excludes the failed order');
$t->assertTrue($near($sk['shipping_cost'], 3.43), 'SK prepaid DPD estimate');
$t->assertSame(1, $sk['payment_fee_missing_orders'], 'card fee missing flagged');
$t->assertSame(0, $sk['cogs_full_orders'], 'uncosted SK order is not in the fully-covered sample');
$t->assertTrue($near($sk['contribution_profit'], 120 - 3.43), 'SK profit = revenue - shipping (COGS unknown -> not subtracted)');
$t->assertSame(1, $sk['orders_open'], 'open order bucket');

exit($t->summary() ? 0 : 1);
