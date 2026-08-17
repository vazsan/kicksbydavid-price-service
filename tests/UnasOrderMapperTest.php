<?php

declare(strict_types=1);

require __DIR__ . '/../app/Core/Autoloader.php';
require __DIR__ . '/TestKit.php';

\App\Core\Autoloader::register('App', __DIR__ . '/../app');

use App\Services\UnasOrderMapper;

$fixtures = require __DIR__ . '/fixtures/unas_order_items.php';
$mixedOrderFactory = require __DIR__ . '/fixtures/unas_mixed_order.php';
$mapper = new UnasOrderMapper();
$t = new TestKit('UnasOrderMapper');

// --- normalizeToList(): the single-vs-list SimpleXML/json_encode quirk ---
$t->assertSame([], $mapper->normalizeToList(null), 'normalizeToList(null) is empty');
$t->assertSame(
    1,
    count($mapper->normalizeToList(['Sku' => 'x'])),
    'a single associative Item array normalizes to a 1-element list'
);
$t->assertSame(
    2,
    count($mapper->normalizeToList([['Sku' => 'a'], ['Sku' => 'b']])),
    'an already-sequential list of Items stays a list'
);

// --- mapOrderHeader(): confirmed header fields ---
$order = $mixedOrderFactory('97.10');
$header = $mapper->mapOrderHeader($order, 'EUR');

$t->assertSame('500123', $header['unas_order_id'], 'maps <Id> to unas_order_id');
$t->assertSame('abc123def456', $header['unas_order_key'], 'maps <Key> to unas_order_key');
$t->assertSame('2026-08-10 12:00:00', $header['order_date'], 'maps <Date> to order_date');
$t->assertSame('2026-08-11 09:00:00', $header['unas_date_mod'], 'maps <DateMod> to unas_date_mod');
$t->assertSame('close_ok', $header['status_type'], 'maps <StatusType> to status_type');
$t->assertSame('cod', $header['payment_method'], 'maps <Payment><Type> to payment_method');
$t->assertSame('paid', $header['payment_status'], 'maps <Payment><Status> to payment_status');
$t->assertSame('97.10', $header['grand_total'], 'maps <SumPriceGross> to grand_total');

$t->assertThrows(
    fn () => $mapper->mapOrderHeader(['Date' => '2026-01-01 00:00:00'], 'EUR'),
    'an order with no <Id> is rejected rather than silently skipping the dedupe key'
);
$t->assertThrows(
    fn () => $mapper->mapOrderHeader(['Id' => '1'], 'EUR'),
    'an order with no parseable <Date> is rejected'
);

// --- mapMerchandiseItem(): confirmed item fields, per-unit interpretation ---
$item = $mapper->mapMerchandiseItem($fixtures['merchandise_sneaker']);
$t->assertSame('1420349296', $item['unas_item_id'], 'maps <Id> to unas_item_id');
$t->assertSame('sneakershieldL', $item['sku'], 'maps <Sku> to sku');
$t->assertSame(1, $item['quantity'], 'maps <Quantity> to an int');
$t->assertSame('4', $item['unit_price_gross'], 'maps <PriceGross> to unit_price_gross verbatim (per-unit interpretation)');

$t->assertThrows(
    fn () => $mapper->mapMerchandiseItem($fixtures['malformed_no_sku']),
    'a merchandise item with no <Sku> is rejected, never inserted with a blank SKU'
);
$t->assertThrows(
    fn () => $mapper->mapMerchandiseItem(['Sku' => 'X', 'PriceGross' => '10']),
    'a merchandise item with no <Quantity> is rejected rather than defaulting to 1 silently'
);
$t->assertThrows(
    fn () => $mapper->mapMerchandiseItem(['Sku' => 'X', 'Quantity' => '1']),
    'a merchandise item with no <PriceGross> is rejected rather than defaulting to 0 silently'
);

// --- mapAdjustmentItem(): synthetic rows never look like merchandise ---
$shipping = $mapper->mapAdjustmentItem($fixtures['shipping_cost'], \App\Services\UnasOrderItemClassifier::SHIPPING);
$t->assertSame('SHIPPING', $shipping['adjustment_type'], 'shipping-cost maps to adjustment_type SHIPPING');
$t->assertSame('3', $shipping['price_gross'], 'shipping-cost price_gross preserved verbatim');

$discount = $mapper->mapAdjustmentItem($fixtures['discount_percent'], \App\Services\UnasOrderItemClassifier::DISCOUNT);
$t->assertSame('DISCOUNT', $discount['adjustment_type'], 'discount-percent maps to adjustment_type DISCOUNT');
$t->assertSame('10', $discount['percent'], 'discount-percent <Percent> preserved');
$t->assertSame('-10.90', $discount['price_gross'], 'discount-percent price_gross stays negative (sign preserved, not pre-summed)');

exit($t->summary() ? 0 : 1);
