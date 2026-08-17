<?php

declare(strict_types=1);

/**
 * Fixtures shaped exactly like the confirmed live UNAS <Item> examples
 * (see the project owner's report and ARCHITECTURE.md "Order line item
 * financial model"). Kept as plain PHP arrays matching what
 * UnasApiService::decodeBody() would produce from the real XML - not the
 * XML itself, since the classifier/mapper/reconciler under test never
 * see raw XML, only the decoded array.
 *
 * @return array<string, array<string, mixed>>
 */
return [
    'merchandise_sneaker' => [
        'Id' => '1420349296',
        'Sku' => 'sneakershieldL',
        'Name' => 'Sneaker Shield L',
        'ProductParams' => ['Param' => ['Name' => 'Size', 'Value' => 'L']],
        'Unit' => 'db',
        'Quantity' => '1',
        'PriceNet' => '4',
        'PriceGross' => '4',
        'Vat' => '0%',
        'Status' => '',
    ],

    'merchandise_shoe' => [
        'Id' => 'CW2288-111',
        'Sku' => 'CW2288-111',
        'Quantity' => '1',
        'PriceNet' => '105',
        'PriceGross' => '105',
        'Vat' => '0%',
    ],

    'shipping_cost' => [
        'Id' => 'shipping-cost',
        'Sku' => 'shipping-cost',
        'Quantity' => '1',
        'PriceNet' => '3',
        'PriceGross' => '3',
    ],

    'gift' => [
        'Id' => 'gift',
        'Sku' => 'gift',
        'Quantity' => '1',
        'PriceNet' => '-4',
        'PriceGross' => '-4',
    ],

    'discount_percent' => [
        'Id' => 'discount-percent',
        'Sku' => 'discount-percent',
        'Quantity' => '1',
        'Percent' => '10',
        'PriceNet' => '-10.90',
        'PriceGross' => '-10.90',
    ],

    // A malformed row (no Sku at all) - must be rejected, never silently
    // treated as merchandise with an empty SKU.
    'malformed_no_sku' => [
        'Id' => '999',
        'Quantity' => '1',
        'PriceGross' => '10',
    ],

    // A hypothetical FUTURE synthetic row this codebase has never seen -
    // exercises the "unknown but probably synthetic" heuristic rather
    // than the known-identifier map.
    'unknown_synthetic_fee' => [
        'Id' => 'handling-fee',
        'Sku' => 'handling-fee',
        'Quantity' => '1',
        'PriceNet' => '2',
        'PriceGross' => '2',
    ],
];
