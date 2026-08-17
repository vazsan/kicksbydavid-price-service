<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;

/**
 * Upserts products + product_variants from a live UNAS <Product> record.
 *
 * IMPORTANT - parent/variant grouping: this UNAS account's /getProduct
 * response returns one <Product> per sellable SKU directly (confirmed
 * live sample: SKU "FZ4625-100-11" with size "EU 45" was itself a full
 * top-level <Product>, and its <Variants> node was empty). UNAS gives no
 * confirmed field that groups sibling sizes under one parent, so - per
 * "if no explicit parent identifier exists, do not invent one" - this
 * repository creates a 1:1 "shadow" parent `products` row per SKU, using
 * the same UNAS <Id> for both products.unas_product_id and
 * product_variants.unas_variant_id. If a real grouping field is
 * confirmed later, a follow-up migration can merge these shadow parents
 * without touching product_variants/order_items (which reference
 * product_variants, not products, everywhere it matters for profit
 * calculations).
 */
final class ProductRepository
{
    /**
     * Looks up a variant by SKU for linking order_items.product_variant_id.
     * Returns null if the SKU hasn't been synced by
     * cron/sync_unas_products.php yet - order_items.product_variant_id is
     * nullable specifically for this case (see its schema comment).
     */
    public function findVariantIdBySku(string $sku): ?int
    {
        $stmt = Database::connection()->prepare(
            'SELECT id FROM product_variants WHERE sku = :sku LIMIT 1'
        );
        $stmt->execute(['sku' => $sku]);
        $id = $stmt->fetchColumn();

        return $id === false ? null : (int) $id;
    }

    /**
     * @param array{unas_product_id: string, name: string} $productData
     * @param array{
     *     sku: string,
     *     unas_variant_id: string,
     *     list_price: ?string,
     *     current_price: ?string,
     *     raw_prices: ?string,
     *     raw_params: ?string,
     *     raw_statuses: ?string,
     *     currency: string,
     *     unas_state: ?string,
     *     unas_created_at: ?string,
     *     unas_modified_at: ?string,
     *     url: ?string
     * } $variantData
     * @return array{product_id: int, variant_id: int}
     */
    public function upsertProductAndVariant(array $productData, array $variantData): array
    {
        $pdo = Database::connection();
        $pdo->beginTransaction();

        try {
            $productId = $this->upsertProduct($productData);
            $variantId = $this->upsertVariant($productId, $variantData);
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        return ['product_id' => $productId, 'variant_id' => $variantId];
    }

    private function upsertProduct(array $data): int
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO products (unas_product_id, name, created_at, updated_at)
             VALUES (:unas_product_id, :name, NOW(), NOW())
             ON DUPLICATE KEY UPDATE
                id = LAST_INSERT_ID(id),
                name = VALUES(name)'
        );
        $stmt->execute([
            'unas_product_id' => $data['unas_product_id'],
            'name' => $data['name'],
        ]);

        return (int) Database::connection()->lastInsertId();
    }

    private function upsertVariant(int $productId, array $data): int
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO product_variants (
                product_id, unas_variant_id, sku, list_price, current_price,
                raw_prices, raw_params, raw_statuses, currency,
                unas_state, unas_created_at, unas_modified_at, url,
                created_at, updated_at
             ) VALUES (
                :product_id, :unas_variant_id, :sku, :list_price, :current_price,
                :raw_prices, :raw_params, :raw_statuses, :currency,
                :unas_state, :unas_created_at, :unas_modified_at, :url,
                NOW(), NOW()
             )
             ON DUPLICATE KEY UPDATE
                id = LAST_INSERT_ID(id),
                product_id = VALUES(product_id),
                unas_variant_id = VALUES(unas_variant_id),
                list_price = VALUES(list_price),
                current_price = VALUES(current_price),
                raw_prices = VALUES(raw_prices),
                raw_params = VALUES(raw_params),
                raw_statuses = VALUES(raw_statuses),
                currency = VALUES(currency),
                unas_state = VALUES(unas_state),
                unas_created_at = VALUES(unas_created_at),
                unas_modified_at = VALUES(unas_modified_at),
                url = VALUES(url)'
        );

        $stmt->execute([
            'product_id' => $productId,
            'unas_variant_id' => $data['unas_variant_id'],
            'sku' => $data['sku'],
            'list_price' => $data['list_price'],
            'current_price' => $data['current_price'],
            'raw_prices' => $data['raw_prices'],
            'raw_params' => $data['raw_params'],
            'raw_statuses' => $data['raw_statuses'],
            'currency' => $data['currency'],
            'unas_state' => $data['unas_state'],
            'unas_created_at' => $data['unas_created_at'],
            'unas_modified_at' => $data['unas_modified_at'],
            'url' => $data['url'],
        ]);

        return (int) Database::connection()->lastInsertId();
    }
}
