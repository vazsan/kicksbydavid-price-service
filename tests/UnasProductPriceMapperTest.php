<?php

declare(strict_types=1);

require __DIR__ . '/../app/Core/Autoloader.php';
require __DIR__ . '/TestKit.php';

\App\Core\Autoloader::register('App', __DIR__ . '/../app');

use App\Services\UnasProductPriceMapper;

$mapper = new UnasProductPriceMapper();
$t = new TestKit('UnasProductPriceMapper');

// --- Confirmed production bug: <Actual> is a flag ("1"), never a price ---

// 1. Single normal active price row: Gross=189, Actual=1 -> both resolve to 189
$oneActiveRow = [
    'Prices' => [
        'Price' => ['Type' => 'normal', 'Net' => '189', 'Gross' => '189', 'Actual' => '1'],
    ],
];
$result1 = $mapper->extractPrice($oneActiveRow);
$t->assertSame('189', $result1['list_price'], 'single active normal row: list_price = Gross (189), not the flag');
$t->assertSame('189', $result1['current_price'], 'single active normal row: current_price = Gross (189), never the Actual flag value (would have been "1")');

// 2. Multiple rows, exactly one flagged Actual=1 - a real sale price
// surfaces naturally without inventing sale-price semantics: we just
// read whichever row UNAS flagged.
$multipleRowsOneActive = [
    'Prices' => [
        'Price' => [
            ['Type' => 'normal', 'Net' => '150', 'Gross' => '200'],
            ['Type' => 'sale', 'Net' => '112', 'Gross' => '150', 'Actual' => '1'],
        ],
    ],
];
$result2 = $mapper->extractPrice($multipleRowsOneActive);
$t->assertSame('200', $result2['list_price'], 'multiple rows: list_price comes from the Type=normal row (200), unaffected by which row is flagged');
$t->assertSame('150', $result2['current_price'], 'multiple rows: current_price comes from the row flagged Actual=1 (150), not the normal row');

// 3. Missing Actual flag entirely - no evidence of a different current
// price, so none is invented; current_price falls back to list_price.
$missingActualFlag = [
    'Prices' => [
        'Price' => ['Type' => 'normal', 'Net' => '189', 'Gross' => '189'],
    ],
];
$result3 = $mapper->extractPrice($missingActualFlag);
$t->assertSame('189', $result3['list_price'], 'missing Actual flag: list_price still resolves from the normal row');
$t->assertSame('189', $result3['current_price'], 'missing Actual flag: current_price falls back to list_price rather than being left unexplained or guessed');

// 3b. Missing Actual flag with multiple rows, none flagged - same fallback.
$multipleRowsNoneActive = [
    'Prices' => [
        'Price' => [
            ['Type' => 'normal', 'Net' => '150', 'Gross' => '200'],
            ['Type' => 'other', 'Net' => '100', 'Gross' => '140'],
        ],
    ],
];
$result3b = $mapper->extractPrice($multipleRowsNoneActive);
$t->assertSame('200', $result3b['list_price'], 'multiple rows, none flagged: list_price from the normal row');
$t->assertSame('200', $result3b['current_price'], 'multiple rows, none flagged: current_price falls back to list_price, not invented from an unflagged row');

// 4. Malformed/non-numeric Gross - null, never guessed/crashed
$malformedGross = [
    'Prices' => [
        'Price' => ['Type' => 'normal', 'Net' => '189', 'Gross' => 'N/A', 'Actual' => '1'],
    ],
];
$result4 = $mapper->extractPrice($malformedGross);
$t->assertNull($result4['list_price'], 'non-numeric Gross on the normal row: list_price is null, not "N/A" or a fabricated number');
$t->assertNull($result4['current_price'], 'non-numeric Gross on the (also active) row: current_price is null too, no crash');

// 4b. Malformed Gross on the flagged row only, valid Gross on the normal row.
$malformedGrossOnActiveOnly = [
    'Prices' => [
        'Price' => [
            ['Type' => 'normal', 'Net' => '150', 'Gross' => '200'],
            ['Type' => 'sale', 'Net' => '100', 'Gross' => 'bad-value', 'Actual' => '1'],
        ],
    ],
];
$result4b = $mapper->extractPrice($malformedGrossOnActiveOnly);
$t->assertSame('200', $result4b['list_price'], 'malformed Gross only on the flagged row: list_price is still read correctly from the valid normal row');
$t->assertNull($result4b['current_price'], 'malformed Gross on the flagged row: current_price is null - never silently substituted with the (unrelated) normal row\'s price');

// --- No Prices block at all ---
$noPrices = [];
$result5 = $mapper->extractPrice($noPrices);
$t->assertNull($result5['list_price'], 'a product with no <Prices> block at all: list_price is null');
$t->assertNull($result5['current_price'], 'a product with no <Prices> block at all: current_price is null');

// --- Actual=0 is explicitly "not active", not treated as a flag match ---
$actualZero = [
    'Prices' => [
        'Price' => [
            ['Type' => 'normal', 'Net' => '150', 'Gross' => '200', 'Actual' => '0'],
        ],
    ],
];
$result6 = $mapper->extractPrice($actualZero);
$t->assertSame('200', $result6['current_price'], 'Actual=0 is not an active flag - current_price still falls back to list_price, not treated as "flagged"');

// --- normalizeToList(): the single-vs-list SimpleXML/json_encode quirk (same as UnasOrderMapper's) ---
$t->assertSame([], $mapper->normalizeToList(null), 'normalizeToList(null) is empty');
$t->assertSame(1, count($mapper->normalizeToList(['Type' => 'normal'])), 'a single associative Price row normalizes to a 1-element list');
$t->assertSame(2, count($mapper->normalizeToList([['Type' => 'normal'], ['Type' => 'sale']])), 'an already-sequential list of Price rows stays a list');

exit($t->summary() ? 0 : 1);
