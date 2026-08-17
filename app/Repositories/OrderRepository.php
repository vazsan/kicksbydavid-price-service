<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;

/**
 * Upserts orders + merchandise order_items, and stores the aggregate/
 * reconciliation results computed from an order's full Item list.
 *
 * Synthetic financial rows (shipping/discount/gift/unknown_synthetic) are
 * NOT stored via this repository - see OrderAdjustmentRepository and
 * UnasOrderItemClassifier. upsertItem() must only ever be called for
 * rows the classifier returned MERCHANDISE for.
 *
 * KNOWN LIMITATION: there is no pruning of order_items/order_adjustments
 * rows that UNAS stops returning for an order (e.g. a manually edited
 * order that had a line removed) - re-syncing only adds/updates rows for
 * items UNAS currently returns. Add explicit prune-on-resync logic if
 * that turns out to matter in practice; deliberately left out of this
 * pass to keep the sync job's write surface to inserts/updates only.
 */
final class OrderRepository
{
    /**
     * @param array{
     *     unas_order_id: string,
     *     unas_order_key: ?string,
     *     order_date: string,
     *     unas_date_mod: ?string,
     *     currency: string,
     *     status: string,
     *     status_id: ?string,
     *     status_type: ?string,
     *     payment_method: ?string,
     *     payment_status: ?string,
     *     payment_amount_paid: ?string,
     *     grand_total: string,
     *     raw_payload: string
     * } $data
     * @return int Local orders.id (existing row's id if this was an update).
     */
    public function upsertHeader(array $data): int
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO orders (
                unas_order_id, unas_order_key, order_date, unas_date_mod,
                currency, status, status_id, status_type,
                payment_method, payment_status, payment_amount_paid,
                grand_total, raw_payload, imported_at, created_at, updated_at
             ) VALUES (
                :unas_order_id, :unas_order_key, :order_date, :unas_date_mod,
                :currency, :status, :status_id, :status_type,
                :payment_method, :payment_status, :payment_amount_paid,
                :grand_total, :raw_payload, NOW(), NOW(), NOW()
             )
             ON DUPLICATE KEY UPDATE
                id = LAST_INSERT_ID(id),
                unas_order_key = VALUES(unas_order_key),
                order_date = VALUES(order_date),
                unas_date_mod = VALUES(unas_date_mod),
                currency = VALUES(currency),
                status = VALUES(status),
                status_id = VALUES(status_id),
                status_type = VALUES(status_type),
                payment_method = VALUES(payment_method),
                payment_status = VALUES(payment_status),
                payment_amount_paid = VALUES(payment_amount_paid),
                grand_total = VALUES(grand_total),
                raw_payload = VALUES(raw_payload),
                imported_at = NOW()'
        );

        $stmt->execute([
            'unas_order_id' => $data['unas_order_id'],
            'unas_order_key' => $data['unas_order_key'],
            'order_date' => $data['order_date'],
            'unas_date_mod' => $data['unas_date_mod'],
            'currency' => $data['currency'],
            'status' => $data['status'],
            'status_id' => $data['status_id'],
            'status_type' => $data['status_type'],
            'payment_method' => $data['payment_method'],
            'payment_status' => $data['payment_status'],
            'payment_amount_paid' => $data['payment_amount_paid'],
            'grand_total' => $data['grand_total'],
            'raw_payload' => $data['raw_payload'],
        ]);

        return (int) Database::connection()->lastInsertId();
    }

    /**
     * Upserts one MERCHANDISE line item, keyed on (order_id, unas_item_id).
     * Callers must have already classified the row as merchandise
     * (UnasOrderItemClassifier::MERCHANDISE) - this method does not
     * re-check.
     *
     * list_price_per_unit is set equal to actual_price_per_unit and
     * discount_amount to 0: no separate "before discount" per-item price
     * field was found on merchandise rows (only PriceNet/PriceGross) -
     * discounts are represented as separate order-level adjustment rows
     * instead (see order_adjustments), so there is nothing to subtract
     * here. See ARCHITECTURE.md "Order line item financial model".
     *
     * @param array{
     *     unas_item_id: string,
     *     product_variant_id: ?int,
     *     sku: string,
     *     product_name: string,
     *     quantity: int,
     *     unit_price_gross: string,
     *     currency: string,
     *     raw_payload: string
     * } $data
     * @return int Local order_items.id.
     */
    public function upsertItem(int $orderId, array $data): int
    {
        // No bcmath dependency assumed available on all target cPanel PHP
        // builds - plain float math, rounded to the column's 4 decimals,
        // matches the precision every other money calculation in this
        // codebase already uses (see DashboardController).
        $lineTotal = number_format((float) $data['unit_price_gross'] * $data['quantity'], 4, '.', '');

        $stmt = Database::connection()->prepare(
            'INSERT INTO order_items (
                order_id, unas_item_id, product_variant_id, sku, product_name,
                quantity, list_price_per_unit, actual_price_per_unit,
                discount_amount, line_total, currency, raw_payload,
                created_at, updated_at
             ) VALUES (
                :order_id, :unas_item_id, :product_variant_id, :sku, :product_name,
                :quantity, :list_price, :actual_price,
                0, :line_total, :currency, :raw_payload,
                NOW(), NOW()
             )
             ON DUPLICATE KEY UPDATE
                id = LAST_INSERT_ID(id),
                product_variant_id = VALUES(product_variant_id),
                sku = VALUES(sku),
                product_name = VALUES(product_name),
                quantity = VALUES(quantity),
                list_price_per_unit = VALUES(list_price_per_unit),
                actual_price_per_unit = VALUES(actual_price_per_unit),
                line_total = VALUES(line_total),
                currency = VALUES(currency),
                raw_payload = VALUES(raw_payload)'
        );

        $stmt->execute([
            'order_id' => $orderId,
            'unas_item_id' => $data['unas_item_id'],
            'product_variant_id' => $data['product_variant_id'],
            'sku' => $data['sku'],
            'product_name' => $data['product_name'],
            'quantity' => $data['quantity'],
            'list_price' => $data['unit_price_gross'],
            'actual_price' => $data['unit_price_gross'],
            'line_total' => $lineTotal,
            'currency' => $data['currency'],
            'raw_payload' => $data['raw_payload'],
        ]);

        return (int) Database::connection()->lastInsertId();
    }

    /**
     * Stores the categorized breakdown derived from an order's Item list
     * (see cron/sync_unas_orders.php). subtotal = merchandise gross;
     * shipping_fee_charged/discount_total come from the confirmed
     * shipping-cost/discount-percent synthetic rows when present.
     */
    public function updateAggregates(int $orderId, string $subtotal, string $shippingFeeCharged, string $discountTotal): void
    {
        $stmt = Database::connection()->prepare(
            'UPDATE orders
             SET subtotal = :subtotal,
                 shipping_fee_charged = :shipping_fee_charged,
                 discount_total = :discount_total
             WHERE id = :id'
        );
        $stmt->execute([
            'subtotal' => $subtotal,
            'shipping_fee_charged' => $shippingFeeCharged,
            'discount_total' => $discountTotal,
            'id' => $orderId,
        ]);
    }

    /**
     * Records the SUM(all Item PriceGross*Quantity) vs SumPriceGross
     * reconciliation result. Never "corrects" grand_total - only reports
     * whether it matched.
     */
    public function updateReconciliation(int $orderId, bool $isReconciled, string $difference): void
    {
        $stmt = Database::connection()->prepare(
            'UPDATE orders
             SET is_reconciled = :is_reconciled,
                 reconciliation_difference = :difference,
                 reconciled_at = NOW()
             WHERE id = :id'
        );
        $stmt->execute([
            'is_reconciled' => $isReconciled ? 1 : 0,
            'difference' => $difference,
            'id' => $orderId,
        ]);
    }
}
