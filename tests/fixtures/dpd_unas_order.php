<?php

declare(strict_types=1);

/**
 * Representative decoded UNAS getOrder <Order> record for DpdOrderMapper
 * tests. Shaped after UNAS's documented getOrder schema: the recipient
 * lives under Customer/Addresses/Shipping, contact under Customer/Contact.
 *
 * Returns a factory so each test gets a fresh, independently-mutable copy.
 */

return static function (): array {
    return [
        'Id' => '123456',
        'Key' => 'ORD-2026-0007',
        'Date' => '2026.03.24 20:15:35',
        'Currency' => 'HUF',
        'SumPriceGross' => '28990',
        'Payment' => [
            'Type' => 'Utánvét (készpénz)',
            'Status' => 'Fizetésre vár',
        ],
        'Customer' => [
            'Email' => 'vevo@example.com',
            'Contact' => [
                'Name' => 'Kiss Péter',
                'Phone' => '+36 30 123 4567',
                'Email' => 'kontakt@example.com',
            ],
            'Addresses' => [
                'Shipping' => [
                    'Name' => 'Kiss Péter',
                    'Country' => 'Magyarország',
                    'ZIP' => '1051',
                    'City' => 'Budapest',
                    'Street' => 'Bajcsy-Zsilinszky út 12',
                ],
                'Invoice' => [
                    'Name' => 'Kiss Péter Kft.',
                    'Country' => 'Magyarország',
                    'ZIP' => '1052',
                    'City' => 'Budapest',
                    'Street' => 'Számla utca 1',
                ],
            ],
        ],
        'Items' => [
            'Item' => [
                'Sku' => 'SHOE-42',
                'Name' => 'Nike Air Max 90 (42)',
                'Quantity' => '1',
                'PriceGross' => '28990',
            ],
        ],
    ];
};
