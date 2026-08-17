<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;

/**
 * Upserts non-merchandise <Item> rows (shipping/discount/gift/
 * unknown_synthetic, per UnasOrderItemClassifier) into order_adjustments.
 * These are never sellable SKUs and must never be written to order_items
 * or receive COGS - see that table's comment in migration 004.
 */
final class OrderAdjustmentRepository
{
    /**
     * @param array{
     *     unas_item_id: ?string,
     *     sku: string,
     *     adjustment_type: string,
     *     quantity: int,
     *     price_net: ?string,
     *     price_gross: ?string,
     *     percent: ?string,
     *     currency: string,
     *     raw_payload: string
     * } $data adjustment_type must be one of SHIPPING|DISCOUNT|GIFT|UNKNOWN_SYNTHETIC.
     * @return int Local order_adjustments.id.
     */
    public function upsert(int $orderId, array $data): int
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO order_adjustments (
                order_id, unas_item_id, sku, adjustment_type, quantity,
                price_net, price_gross, percent, currency, raw_payload,
                created_at, updated_at
             ) VALUES (
                :order_id, :unas_item_id, :sku, :adjustment_type, :quantity,
                :price_net, :price_gross, :percent, :currency, :raw_payload,
                NOW(), NOW()
             )
             ON DUPLICATE KEY UPDATE
                id = LAST_INSERT_ID(id),
                sku = VALUES(sku),
                adjustment_type = VALUES(adjustment_type),
                quantity = VALUES(quantity),
                price_net = VALUES(price_net),
                price_gross = VALUES(price_gross),
                percent = VALUES(percent),
                currency = VALUES(currency),
                raw_payload = VALUES(raw_payload)'
        );

        $stmt->execute([
            'order_id' => $orderId,
            'unas_item_id' => $data['unas_item_id'],
            'sku' => $data['sku'],
            'adjustment_type' => $data['adjustment_type'],
            'quantity' => $data['quantity'],
            'price_net' => $data['price_net'],
            'price_gross' => $data['price_gross'],
            'percent' => $data['percent'],
            'currency' => $data['currency'],
            'raw_payload' => $data['raw_payload'],
        ]);

        return (int) Database::connection()->lastInsertId();
    }
}
