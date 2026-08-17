<?php

declare(strict_types=1);

require __DIR__ . '/../app/Core/Autoloader.php';
require __DIR__ . '/TestKit.php';

\App\Core\Autoloader::register('App', __DIR__ . '/../app');

use App\Services\OrderReconciler;
use App\Services\UnasOrderItemClassifier;
use App\Services\UnasOrderMapper;

$mixedOrderFactory = require __DIR__ . '/fixtures/unas_mixed_order.php';
$mapper = new UnasOrderMapper();
$classifier = new UnasOrderItemClassifier();
$reconciler = new OrderReconciler($classifier);
$t = new TestKit('OrderReconciler');

// --- Mixed order (merchandise + shipping + gift + discount) that reconciles ---
$order = $mixedOrderFactory('97.10');
$items = $mapper->normalizeToList($order['Items']['Item'] ?? null);
$t->assertSame(5, count($items), 'fixture has 5 item rows (2 merchandise + shipping + gift + discount)');

$result = $reconciler->reconcile($items, $order['SumPriceGross'], 0.02);

$t->assertTrue(abs($result['merchandise_gross'] - 109.0) < 0.001, 'merchandise_gross = 4.00 + 105.00 = 109.00');
$t->assertTrue(abs($result['shipping_gross'] - 3.0) < 0.001, 'shipping_gross = 3.00');
$t->assertTrue(abs($result['discount_gross'] - 10.90) < 0.001, 'discount_gross is a positive magnitude (10.90), not -10.90');
$t->assertTrue(abs($result['all_items_gross'] - 97.10) < 0.001, 'all_items_gross = 109.00 + 3.00 - 4.00 - 10.90 = 97.10');
$t->assertSame(true, $result['is_reconciled'], 'SumPriceGross (97.10) matches all_items_gross within tolerance -> reconciled');
$t->assertTrue(abs($result['difference']) < 0.001, 'difference is ~0 for a reconciling order');

// --- Same items, deliberately wrong SumPriceGross -> must NOT be silently accepted ---
$mismatchedOrder = $mixedOrderFactory('100.00');
$mismatchedItems = $mapper->normalizeToList($mismatchedOrder['Items']['Item'] ?? null);
$mismatchResult = $reconciler->reconcile($mismatchedItems, $mismatchedOrder['SumPriceGross'], 0.02);

$t->assertSame(false, $mismatchResult['is_reconciled'], 'a wrong SumPriceGross (100.00 vs actual 97.10) is flagged, not silently accepted');
$t->assertTrue(abs($mismatchResult['difference'] - 2.90) < 0.001, 'difference is reported as 100.00 - 97.10 = 2.90, not corrected/hidden');

// --- Merchandise-only order (no synthetic rows at all) ---
$fixtures = require __DIR__ . '/fixtures/unas_order_items.php';
$merchandiseOnly = [$fixtures['merchandise_sneaker'], $fixtures['merchandise_shoe']];
$merchandiseOnlyResult = $reconciler->reconcile($merchandiseOnly, '109', 0.02);

$t->assertSame(true, $merchandiseOnlyResult['is_reconciled'], 'a pure-merchandise order with matching SumPriceGross reconciles');
$t->assertTrue(abs($merchandiseOnlyResult['shipping_gross']) < 0.001, 'no shipping row present -> shipping_gross stays 0');

// --- No items at all -> "not checked", not "reconciled" or "mismatched" ---
$emptyResult = $reconciler->reconcile([], '109', 0.02);
$t->assertNull($emptyResult['is_reconciled'], 'an order with zero parsed items is left unchecked (null), never marked reconciled or mismatched');
$t->assertNull($emptyResult['difference'], 'difference is also null when there is nothing to compare');

exit($t->summary() ? 0 : 1);
