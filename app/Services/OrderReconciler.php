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
 *   alike (shipping/discount/gift/handling/unknown) - compared against
 *   SumPriceGross, within a currency-specific tolerance (see
 *   TOLERANCE_MAP).
 * See ARCHITECTURE.md "Order line item financial model" for why this,
 * rather than e.g. only summing merchandise, is the correct check: the
 * whole point is confirming that *every* row UNAS returns (including the
 * synthetic ones) fully accounts for the order total, so nothing is
 * silently missing from what gets imported.
 */
final class OrderReconciler
{
    /**
     * Reconciliation tolerance per currency, in that currency's own
     * units. Confirmed empirically against a real 14-order production
     * dry-run: EUR needs only sub-cent tolerance (0.02); HUF (in
     * practice an integer-denominated currency in this shop's data - no
     * minor unit) showed rounding residuals up to ~0.44 from percentage-
     * discount arithmetic, so 1.00 HUF was chosen to absorb that
     * specific, observed rounding noise without being wide enough to
     * hide a real mismatch (a missing/extra line item would produce a
     * difference of at least one full merchandise or adjustment price,
     * far larger than 1 HUF).
     */
    public const TOLERANCE_MAP = [
        'EUR' => 0.02,
        'HUF' => 1.00,
    ];

    /**
     * Used for a currency not in TOLERANCE_MAP. Deliberately as tight as
     * EUR's (not wider) so an unrecognized currency never gets a more
     * lenient pass than a known one - callers should log when this
     * fallback is hit (see cron/sync_unas_orders.php) so a real
     * tolerance can be added to the map once that currency is confirmed.
     */
    public const DEFAULT_TOLERANCE = 0.02;

    public function __construct(private readonly UnasOrderItemClassifier $classifier)
    {
    }

    public function toleranceForCurrency(string $currency): float
    {
        return self::TOLERANCE_MAP[$currency] ?? self::DEFAULT_TOLERANCE;
    }

    /**
     * @param array<int, array<string, mixed>> $items Normalized (already-list) raw <Item> rows.
     * @return array{
     *     merchandise_gross: float,
     *     shipping_gross: float,
     *     discount_gross: float,
     *     all_items_gross: float,
     *     is_reconciled: ?bool,
     *     difference: ?float,
     *     tolerance: float,
     *     currency: string
     * } is_reconciled/difference are null when $items is empty (nothing to check).
     */
    public function reconcile(array $items, string $grandTotal, string $currency): array
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
            // GIFT/HANDLING/UNKNOWN_SYNTHETIC are counted in all_items_gross
            // (so reconciliation still accounts for them) but deliberately
            // not bucketed into a dedicated summary column yet - see
            // ARCHITECTURE.md "Order line item financial model".
        }

        $tolerance = $this->toleranceForCurrency($currency);
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
            'tolerance' => $tolerance,
            'currency' => $currency,
        ];
    }
}
