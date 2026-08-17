<?php

declare(strict_types=1);

/**
 * A full <Order> fixture combining merchandise + every synthetic type,
 * shaped like UnasApiService::decodeBody() would produce it. Numbers are
 * self-consistent (unlike the individual item examples in
 * unas_order_items.php, which are illustrative snippets, not one order):
 *
 *   sneakershieldL   4.00
 *   CW2288-111     105.00
 *   -------------------- merchandise subtotal 109.00
 *   shipping-cost    3.00
 *   gift            -4.00
 *   discount-percent -10.90  (10% of 109.00, rounded)
 *   -------------------------------------------------
 *   SumPriceGross:  97.10   (109.00 + 3.00 - 4.00 - 10.90)
 *
 * @param string $sumPriceGross Override to build a deliberately
 *     mismatched order for the reconciliation-failure test case.
 * @return array<string, mixed>
 */
return static function (string $sumPriceGross = '97.10'): array {
    $items = require __DIR__ . '/unas_order_items.php';

    return [
        'Id' => '500123',
        'Key' => 'abc123def456',
        'Date' => '2026-08-10 12:00:00',
        'DateMod' => '2026-08-11 09:00:00',
        'Currency' => 'EUR',
        'Status' => 'Teljesítve',
        'StatusID' => '5',
        'StatusType' => 'close_ok',
        'Payment' => ['Id' => '1', 'Name' => 'Utánvét', 'Type' => 'cod', 'Status' => 'paid', 'Paid' => $sumPriceGross],
        'SumPriceGross' => $sumPriceGross,
        'Items' => [
            'Item' => [
                $items['merchandise_sneaker'],
                $items['merchandise_shoe'],
                $items['shipping_cost'],
                $items['gift'],
                $items['discount_percent'],
            ],
        ],
    ];
};
