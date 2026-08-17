<?php

declare(strict_types=1);

require __DIR__ . '/../app/Core/Autoloader.php';
require __DIR__ . '/TestKit.php';

\App\Core\Autoloader::register('App', __DIR__ . '/../app');

use App\Services\UnasOrderItemClassifier;

$fixtures = require __DIR__ . '/fixtures/unas_order_items.php';
$classifier = new UnasOrderItemClassifier();
$t = new TestKit('UnasOrderItemClassifier');

$t->assertSame(
    UnasOrderItemClassifier::MERCHANDISE,
    $classifier->classify($fixtures['merchandise_sneaker']),
    'sneakershieldL (mixed-case SKU) classifies as merchandise'
);

$t->assertSame(
    UnasOrderItemClassifier::MERCHANDISE,
    $classifier->classify($fixtures['merchandise_shoe']),
    'CW2288-111 (uppercase+digits SKU) classifies as merchandise'
);

$t->assertSame(
    UnasOrderItemClassifier::SHIPPING,
    $classifier->classify($fixtures['shipping_cost']),
    'shipping-cost classifies as shipping'
);

$t->assertSame(
    UnasOrderItemClassifier::DISCOUNT,
    $classifier->classify($fixtures['discount_percent']),
    'discount-percent classifies as discount'
);

$t->assertSame(
    UnasOrderItemClassifier::GIFT,
    $classifier->classify($fixtures['gift']),
    'gift classifies as gift'
);

$t->assertSame(
    UnasOrderItemClassifier::UNKNOWN_SYNTHETIC,
    $classifier->classify($fixtures['unknown_synthetic_fee']),
    'an unrecognized lowercase-slug SKU ("handling-fee") is NOT silently treated as merchandise'
);

$t->assertSame(
    UnasOrderItemClassifier::MERCHANDISE,
    $classifier->classify(['Sku' => 'AB1234-XL', 'Quantity' => '1', 'PriceGross' => '50']),
    'a normal-looking merchandise SKU with digits+hyphen is never misclassified as synthetic'
);

$t->assertSame(
    UnasOrderItemClassifier::UNKNOWN_SYNTHETIC,
    $classifier->classify(['Sku' => 'AB1234-XL', 'Quantity' => '1', 'PriceGross' => '-50']),
    'a negative price on an otherwise normal-looking SKU is excluded from merchandise as a safety net'
);

$t->assertSame(
    UnasOrderItemClassifier::MERCHANDISE,
    $classifier->classify(['Sku' => '', 'Quantity' => '1', 'PriceGross' => '10']),
    'an empty SKU falls through to merchandise here (classifier does not itself require a non-empty SKU - mapMerchandiseItem() is what rejects it, tested separately)'
);

exit($t->summary() ? 0 : 1);
