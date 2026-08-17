<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Computes the categorized gross-amount breakdown of an order's Item
 * list and checks it against UNAS's own <SumPriceGross>. Pure
 * calculation, no I/O - see tests/OrderReconcilerTest.php.
 *
 * The reconciliation formula is exactly what it sounds like:
 *   SUM(all Item PriceGross * Quantity) - merchandise AND synthetic rows
 *   alike (shipping/discount/gift/unknown) - compared against
 *   SumPriceGross, within a small currency tolerance.
 * See ARCHITECTURE.md "Order line item financial model" for why this,
 * rather than e.g. only summing merchandise, is the correct check: the
 * whole point is confirming that *every* row UNAS returns (including the
 * synthetic ones) fully accounts for the order total, so nothing is
 * silently missing from what gets imported.
 */
final class OrderReconciler
{
    public function __construct(private readonly UnasOrderItemClassifier $classifier)
    {
    }

    /**
     * @param array<int, array<string, mixed>> $items Normalized (already-list) raw <Item> rows.
     * @return array{
     *     merchandise_gross: float,
     *     shipping_gross: float,
     *     discount_gross: float,
     *     all_items_gross: float,
     *     is_reconciled: ?bool,
     *     difference: ?float
     * } is_reconciled/difference are null when $items is empty (nothing to check).
     */
    public function reconcile(array $items, string $grandTotal, float $tolerance): array
    {
        $merchandiseGross = 0.0;
        $shippingGross = 0.0;
        $discountGross = 0.0;
        $allItemsGross = 0.0;

        foreach ($items as $item) {
            $classification = $this->classifier->classify($item);
            $quantity = is_numeric($item['Quantity'] ?? null) ? (int) $item['Quantity'] : 1;
            $priceGross = is_numeric($item['PriceGross'] ?? null) ? (float) $item['PriceGross'] : 0.0;
            $lineGross = $priceGross * $quantity;
            $allItemsGross += $lineGross;

            if ($classification === UnasOrderItemClassifier::MERCHANDISE) {
                $merchandiseGross += $lineGross;
            } elseif ($classification === UnasOrderItemClassifier::SHIPPING) {
                $shippingGross += $lineGross;
            } elseif ($classification === UnasOrderItemClassifier::DISCOUNT) {
                // Stored/reported as a positive magnitude (orders.discount_total convention).
                $discountGross += abs($lineGross);
            }
        }

        $isReconciled = null;
        $difference = null;

        if ($items !== []) {
            $difference = (float) $grandTotal - $allItemsGross;
            $isReconciled = abs($difference) <= $tolerance;
        }

        return [
            'merchandise_gross' => $merchandiseGross,
            'shipping_gross' => $shippingGross,
            'discount_gross' => $discountGross,
            'all_items_gross' => $allItemsGross,
            'is_reconciled' => $isReconciled,
            'difference' => $difference,
        ];
    }
}
