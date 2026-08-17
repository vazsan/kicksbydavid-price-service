<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Pure XML-array-to-domain-array mapping for UNAS orders/items. No I/O,
 * no DB, no HTTP - kept separate from cron/sync_unas_orders.php (which
 * owns persistence/orchestration) specifically so it can be unit tested
 * without a database or a live API call - see tests/.
 *
 * Field choices here are documented in each method; the overall model is
 * documented in ARCHITECTURE.md "Order line item financial model".
 */
final class UnasOrderMapper
{
    /**
     * UNAS's XML-to-array decoding collapses a single repeated child
     * element into an associative array (not a list) when there's only
     * one of it - a classic SimpleXML/json_encode quirk. This normalizes
     * either shape into a plain list so callers never have to
     * special-case "one result".
     *
     * @return array<int, array<string, mixed>>
     */
    public function normalizeToList(mixed $value): array
    {
        if ($value === null || !is_array($value)) {
            return [];
        }

        return array_is_list($value) ? $value : [$value];
    }

    public function parseUnasDate(mixed $value): ?string
    {
        if (!is_string($value) || $value === '') {
            return null;
        }

        try {
            return (new \DateTimeImmutable($value))->format('Y-m-d H:i:s');
        } catch (\Exception) {
            return null;
        }
    }

    /**
     * @param array<string, mixed> $order
     * @return array<string, mixed>
     */
    public function mapOrderHeader(array $order, string $fallbackCurrency): array
    {
        $unasOrderId = $order['Id'] ?? null;
        if (!is_scalar($unasOrderId) || (string) $unasOrderId === '') {
            throw new \RuntimeException('Order record has no <Id> - cannot dedupe/upsert it, skipping.');
        }

        $orderDate = $this->parseUnasDate($order['Date'] ?? null);
        if ($orderDate === null) {
            throw new \RuntimeException('Order ' . $unasOrderId . ' has no parseable <Date>.');
        }

        $payment = is_array($order['Payment'] ?? null) ? $order['Payment'] : [];

        return [
            'unas_order_id' => (string) $unasOrderId,
            'unas_order_key' => isset($order['Key']) ? (string) $order['Key'] : null,
            'order_date' => $orderDate,
            'unas_date_mod' => $this->parseUnasDate($order['DateMod'] ?? null),
            'currency' => isset($order['Currency']) && $order['Currency'] !== '' ? (string) $order['Currency'] : $fallbackCurrency,
            'status' => isset($order['Status']) ? (string) $order['Status'] : 'unknown',
            'status_id' => isset($order['StatusID']) ? (string) $order['StatusID'] : null,
            'status_type' => isset($order['StatusType']) ? (string) $order['StatusType'] : null,
            'payment_method' => isset($payment['Type']) ? (string) $payment['Type'] : null,
            'payment_status' => isset($payment['Status']) ? (string) $payment['Status'] : null,
            'payment_amount_paid' => isset($payment['Paid']) && is_numeric($payment['Paid']) ? (string) $payment['Paid'] : null,
            'grand_total' => isset($order['SumPriceGross']) && is_numeric($order['SumPriceGross']) ? (string) $order['SumPriceGross'] : '0',
            'raw_payload' => json_encode($order, JSON_UNESCAPED_UNICODE) ?: '{}',
        ];
    }

    /**
     * @param array<string, mixed> $item
     * @return array{unas_item_id: ?string, sku: string, product_name: string, quantity: int, unit_price_gross: string, raw_payload: string}
     */
    public function mapMerchandiseItem(array $item): array
    {
        $sku = $item['Sku'] ?? null;
        $quantity = $item['Quantity'] ?? null;
        $priceGross = $item['PriceGross'] ?? null;

        if (!is_scalar($sku) || (string) $sku === '') {
            throw new \RuntimeException('Merchandise item has no <Sku>.');
        }
        if (!is_numeric($quantity) || (int) $quantity < 1) {
            throw new \RuntimeException('Item ' . $sku . ' has no valid <Quantity>.');
        }
        if (!is_numeric($priceGross)) {
            throw new \RuntimeException('Item ' . $sku . ' has no valid <PriceGross>.');
        }

        return [
            'unas_item_id' => isset($item['Id']) ? (string) $item['Id'] : null,
            'sku' => (string) $sku,
            'product_name' => isset($item['Name']) && (string) $item['Name'] !== '' ? (string) $item['Name'] : (string) $sku,
            'quantity' => (int) $quantity,
            // Interpreted as PER-UNIT gross price (not a line total) - see
            // ARCHITECTURE.md "Order line item financial model": this
            // matches the reconciliation formula PriceGross * Quantity.
            'unit_price_gross' => (string) $priceGross,
            'raw_payload' => json_encode($item, JSON_UNESCAPED_UNICODE) ?: '{}',
        ];
    }

    /**
     * @param array<string, mixed> $item
     * @return array{unas_item_id: ?string, sku: string, adjustment_type: string, quantity: int, price_net: ?string, price_gross: ?string, percent: ?string, raw_payload: string}
     */
    public function mapAdjustmentItem(array $item, string $classification): array
    {
        $sku = $item['Sku'] ?? null;
        if (!is_scalar($sku) || (string) $sku === '') {
            throw new \RuntimeException('Adjustment item has no <Sku>.');
        }

        $typeMap = [
            UnasOrderItemClassifier::SHIPPING => 'SHIPPING',
            UnasOrderItemClassifier::DISCOUNT => 'DISCOUNT',
            UnasOrderItemClassifier::GIFT => 'GIFT',
            UnasOrderItemClassifier::UNKNOWN_SYNTHETIC => 'UNKNOWN_SYNTHETIC',
        ];

        return [
            'unas_item_id' => isset($item['Id']) ? (string) $item['Id'] : null,
            'sku' => (string) $sku,
            'adjustment_type' => $typeMap[$classification] ?? 'UNKNOWN_SYNTHETIC',
            'quantity' => is_numeric($item['Quantity'] ?? null) ? (int) $item['Quantity'] : 1,
            'price_net' => isset($item['PriceNet']) && is_numeric($item['PriceNet']) ? (string) $item['PriceNet'] : null,
            'price_gross' => isset($item['PriceGross']) && is_numeric($item['PriceGross']) ? (string) $item['PriceGross'] : null,
            'percent' => isset($item['Percent']) && is_numeric($item['Percent']) ? (string) $item['Percent'] : null,
            'raw_payload' => json_encode($item, JSON_UNESCAPED_UNICODE) ?: '{}',
        ];
    }
}
