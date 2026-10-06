<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;

/**
 * Access to dpd_shipments (migration 007). Keeps one row per UNAS order
 * that has had a DPD label generated, so a second run for the same order
 * can be refused instead of silently registering a duplicate waybill.
 */
final class DpdShipmentRepository
{
    /**
     * @return array<string, mixed>|null The existing shipment row, or null.
     */
    public function findByUnasOrderId(string $unasOrderId): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT * FROM dpd_shipments WHERE unas_order_id = :oid LIMIT 1'
        );
        $stmt->execute(['oid' => $unasOrderId]);
        $row = $stmt->fetch();

        return is_array($row) ? $row : null;
    }

    /**
     * Inserts or updates the shipment record for an order (unas_order_id
     * is unique). Returns the row id.
     *
     * @param array{
     *     unas_order_id: string,
     *     order_id?: ?int,
     *     session_id?: ?string,
     *     waybills?: array<int, string>|string,
     *     sender_fid?: ?string,
     *     parcel_count?: int,
     *     label_page_format?: string,
     *     label_path?: ?string,
     *     status?: string,
     *     error_message?: ?string
     * } $data
     */
    public function save(array $data): int
    {
        $waybills = $data['waybills'] ?? '';
        if (is_array($waybills)) {
            $waybills = implode(',', $waybills);
        }

        $params = [
            'unas_order_id' => $data['unas_order_id'],
            'order_id' => $data['order_id'] ?? null,
            'session_id' => $data['session_id'] ?? null,
            'waybills' => (string) $waybills,
            'sender_fid' => $data['sender_fid'] ?? null,
            'parcel_count' => $data['parcel_count'] ?? 1,
            'label_page_format' => $data['label_page_format'] ?? 'A4',
            'label_path' => $data['label_path'] ?? null,
            'status' => $data['status'] ?? 'created',
            'error_message' => isset($data['error_message']) && $data['error_message'] !== null
                ? mb_substr((string) $data['error_message'], 0, 4000)
                : null,
        ];

        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO dpd_shipments
                (unas_order_id, order_id, session_id, waybills, sender_fid, parcel_count,
                 label_page_format, label_path, status, error_message, created_at, updated_at)
             VALUES
                (:unas_order_id, :order_id, :session_id, :waybills, :sender_fid, :parcel_count,
                 :label_page_format, :label_path, :status, :error_message, NOW(), NOW())
             ON DUPLICATE KEY UPDATE
                order_id = VALUES(order_id),
                session_id = VALUES(session_id),
                waybills = VALUES(waybills),
                sender_fid = VALUES(sender_fid),
                parcel_count = VALUES(parcel_count),
                label_page_format = VALUES(label_page_format),
                label_path = VALUES(label_path),
                status = VALUES(status),
                error_message = VALUES(error_message),
                updated_at = NOW()'
        );
        $stmt->execute($params);

        $existing = $this->findByUnasOrderId($data['unas_order_id']);

        return $existing !== null ? (int) $existing['id'] : (int) $db->lastInsertId();
    }
}
