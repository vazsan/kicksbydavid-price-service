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

// --- parseUnasDate(): confirmed live dot-format primary, ISO fallback ---
$t->assertSame(
    '2026-03-24 20:15:35',
    $mapper->parseUnasDate('2026.03.24 20:15:35'),
    'primary format "Y.m.d H:i:s" (confirmed live UNAS format) parses correctly'
);
$t->assertSame(
    '2026-03-27 16:13:57',
    $mapper->parseUnasDate('2026.03.27 16:13:57'),
    'primary format parses a second confirmed live example correctly'
);
$t->assertSame(
    '2026-08-10 12:00:00',
    $mapper->parseUnasDate('2026-08-10 12:00:00'),
    'fallback format "Y-m-d H:i:s" (ISO) still parses correctly'
);
$t->assertNull(
    $mapper->parseUnasDate('not-a-date'),
    'an unparseable date string returns null rather than throwing'
);
$t->assertNull($mapper->parseUnasDate(null), 'a null date value returns null');
$t->assertNull($mapper->parseUnasDate(''), 'an empty date string returns null');

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

// --- mapOrderHeader() with the confirmed live dot-format <Date>/<DateMod> ---
$dotFormatOrder = $mapper->mapOrderHeader([
    'Id' => '600001',
    'Date' => '2026.03.24 20:15:35',
    'DateMod' => '2026.03.27 16:13:57',
], 'EUR');
$t->assertSame('2026-03-24 20:15:35', $dotFormatOrder['order_date'], '<Date> in live dot format is parsed by mapOrderHeader (previously the reported bug: this order would have been rejected)');
$t->assertSame('2026-03-27 16:13:57', $dotFormatOrder['unas_date_mod'], '<DateMod> in live dot format is parsed by mapOrderHeader too');

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

$discountAmount = $mapper->mapAdjustmentItem($fixtures['discount_amount'], \App\Services\UnasOrderItemClassifier::DISCOUNT);
$t->assertSame('DISCOUNT', $discountAmount['adjustment_type'], 'discount-amount maps to adjustment_type DISCOUNT');
$t->assertSame('-5', $discountAmount['price_gross'], 'discount-amount price_gross stays negative (sign preserved exactly)');

$handling = $mapper->mapAdjustmentItem($fixtures['handel_cost'], \App\Services\UnasOrderItemClassifier::HANDLING);
$t->assertSame('HANDLING', $handling['adjustment_type'], 'handel-cost maps to adjustment_type HANDLING');
$t->assertSame('2.50', $handling['price_gross'], 'handel-cost price_gross preserved verbatim as a positive charge');

// --- Regression test: mapOrderHeader() must never emit the literal string
// "Array" for a field that decoded to an array instead of a scalar
// (confirmed production bug: "would upsert order X (Array, 43228 HUF)") ---
$arrayStatusOrder = $mapper->mapOrderHeader([
    'Id' => '700001',
    'Date' => '2026.03.24 20:15:35',
    // Simulates the one confirmed SimpleXML/json_encode shape for an
    // element with both attributes and text content: the text lands at
    // numeric key 0 alongside an "@attributes" sibling.
    'Status' => ['@attributes' => ['modified' => '1'], 0 => 'Teljesítve'],
], 'EUR');
$t->assertSame('Teljesítve', $arrayStatusOrder['status'], 'a <Status> that decodes with attributes (text at key 0) is resolved to its real text, not the literal string "Array"');
$t->assertTrue($arrayStatusOrder['status'] !== 'Array', 'status is never the literal string "Array"');

$unresolvableArrayOrder = $mapper->mapOrderHeader([
    'Id' => '700002',
    'Date' => '2026.03.24 20:15:35',
    // A shape with no plausible scalar to extract at all.
    'Status' => ['@attributes' => ['modified' => '1']],
], 'EUR');
$t->assertSame('unknown', $unresolvableArrayOrder['status'], 'a <Status> that decodes to an array with no extractable scalar falls back to "unknown" rather than fabricating or printing "Array"');

exit($t->summary() ? 0 : 1);
