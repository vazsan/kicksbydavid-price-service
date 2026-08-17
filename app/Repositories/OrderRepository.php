<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;

/**
 * Upserts order HEADER rows only, keyed on unas_order_id (dedupe).
 *
 * Deliberately has no method to insert order_items yet: the UNAS
 * <Item> child element names for quantity/unit price/discount are not
 * yet confirmed (see ARCHITECTURE.md "UNAS API integration status" and
 * ASSUMPTIONS.md) and those columns are NOT NULL - guessing them would
 * risk silently writing wrong revenue/COGS inputs into a financial
 * system, which is exactly what this codebase's "no guessing" rule
 * exists to prevent. Add an insertItem()-style method here once that
 * mapping is confirmed; do not add one before then.
 *
 * Only columns whose UNAS source field is confirmed are written. Columns
 * this repository never touches (shipping_method, shipping_fee_charged,
 * customer_email, customer_country, discount_total, subtotal,
 * is_cancelled) are intentionally left out of both the INSERT and the
 * ON DUPLICATE KEY UPDATE clause, so a later mapping pass (or manual
 * admin-UI entry) can fill them in without this repository clobbering
 * them back to their defaults on every re-sync.
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
}
