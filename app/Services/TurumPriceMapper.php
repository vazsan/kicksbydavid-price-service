<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Pure mapping of a Turum /v1/products_full_list_new product list into
 * turum_prices rows. No I/O - unit tested in tests/TurumPriceMapperTest.php.
 *
 * Confirmed list shape (fleet copy store/arres/data/turum.json, 2186
 * products / 7818 variants): product {sku, price, variants[]}, variant
 * {variant_id, size, eu_size, stock, price}. The pairing key uses
 * variant `size` (not eu_size), exactly like the fleet's arres.py /
 * profit_month.py, which produced the October Unas-Turum pairing.
 * Variant price is taken as EUR (Turum is a EUR B2B price list; the
 * fleet's profit_month.py treats it the same way).
 */
final class TurumPriceMapper
{
    public static function key(string $turumSku, string $size): string
    {
        return strtoupper(trim($turumSku) . '-' . str_replace('.', '-', trim($size)));
    }

    /**
     * @param array<int, mixed> $products
     * @return array<string, array{turum_key: string, turum_sku: string, size: string, variant_id: ?string, price: string, stock: ?int}>
     *     Keyed by turum_key; a later duplicate key overwrites an earlier one.
     */
    public function variantRows(array $products): array
    {
        $rows = [];
        foreach ($products as $product) {
            if (!is_array($product) || !is_scalar($product['sku'] ?? null) || (string) $product['sku'] === '') {
                continue;
            }
            foreach (is_array($product['variants'] ?? null) ? $product['variants'] : [] as $variant) {
                if (!is_array($variant) || !is_scalar($variant['size'] ?? null) || (string) $variant['size'] === '') {
                    continue;
                }
                $price = $variant['price'] ?? null;
                if (!is_numeric($price) || (float) $price <= 0) {
                    continue; // No usable price - leave the SKU uncosted rather than guess.
                }
                $key = self::key((string) $product['sku'], (string) $variant['size']);
                if (strlen($key) > 100) {
                    continue;
                }
                $rows[$key] = [
                    'turum_key' => $key,
                    'turum_sku' => substr((string) $product['sku'], 0, 64),
                    'size' => substr((string) $variant['size'], 0, 20),
                    'variant_id' => is_scalar($variant['variant_id'] ?? null) ? substr((string) $variant['variant_id'], 0, 64) : null,
                    'price' => number_format((float) $price, 4, '.', ''),
                    'stock' => is_numeric($variant['stock'] ?? null) ? (int) $variant['stock'] : null,
                ];
            }
        }
        return $rows;
    }
}
