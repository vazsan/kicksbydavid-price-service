<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Classifies one decoded UNAS <Order><Items><Item> row before persistence.
 *
 * UNAS mixes real merchandise lines with synthetic financial rows inside
 * the same <Items> list - confirmed live examples:
 *
 *   <Item><Id>1420349296</Id><Sku>sneakershieldL</Sku><Quantity>1</Quantity>
 *         <PriceNet>4</PriceNet><PriceGross>4</PriceGross><Vat>0%</Vat></Item>
 *   <Item><Id>CW2288-111</Id><Sku>CW2288-111</Sku><Quantity>1</Quantity>
 *         <PriceNet>105</PriceNet><PriceGross>105</PriceGross></Item>
 *
 *   <Item><Id>shipping-cost</Id><Sku>shipping-cost</Sku><Quantity>1</Quantity>
 *         <PriceNet>3</PriceNet><PriceGross>3</PriceGross></Item>
 *   <Item><Id>gift</Id><Sku>gift</Sku><Quantity>1</Quantity>
 *         <PriceNet>-4</PriceNet><PriceGross>-4</PriceGross></Item>
 *   <Item><Id>discount-percent</Id><Sku>discount-percent</Sku><Quantity>1</Quantity>
 *         <Percent>100</Percent><PriceNet>-202</PriceNet><PriceGross>-202</PriceGross></Item>
 *   <Item><Id>discount-amount</Id><Sku>discount-amount</Sku><Quantity>1</Quantity>
 *         <PriceNet>-X</PriceNet><PriceGross>-X</PriceGross></Item>
 *   <Item><Id>handel-cost</Id><Sku>handel-cost</Sku><Quantity>1</Quantity>
 *         <PriceNet>X</PriceNet><PriceGross>X</PriceGross></Item>
 *
 * ("handel-cost" is UNAS's own spelling, confirmed live - not a typo
 * introduced here.) Confirmed live: discount-amount is a negative
 * fixed-amount discount (the counterpart to discount-percent's
 * percentage-based one); handel-cost is a positive per-order handling/
 * processing charge, distinct from shipping-cost.
 *
 * Treating a synthetic row as merchandise would create a fake SKU/product
 * and, worse, give it COGS it never should have. This class exists to
 * make that classification an explicit, single, testable decision point
 * instead of scattered ad-hoc checks in the sync job.
 *
 * Only the identifiers in KNOWN_SYNTHETIC are CONFIRMED. Anything else
 * that merely *looks* synthetic (see looksLikeSyntheticSlug()) is
 * classified UNKNOWN_SYNTHETIC, not MERCHANDISE - i.e. when unsure, this
 * errs toward excluding a row from order_items (where it could pollute
 * revenue/COGS) rather than excluding it from the "definitely fine to
 * treat as a normal sale" set. UNKNOWN_SYNTHETIC rows are still
 * persisted (to order_adjustments, with their full raw payload) so
 * nothing is silently lost - they just aren't assumed to be a specific
 * known type either.
 */
final class UnasOrderItemClassifier
{
    public const MERCHANDISE = 'merchandise';
    public const SHIPPING = 'shipping';
    public const DISCOUNT = 'discount';
    public const GIFT = 'gift';
    public const HANDLING = 'handling';
    public const UNKNOWN_SYNTHETIC = 'unknown_synthetic';

    /**
     * Confirmed synthetic SKU/Id -> classification. Extend this map as
     * new synthetic identifiers are confirmed from real orders - do not
     * assume this list is complete (see looksLikeSyntheticSlug()).
     */
    private const KNOWN_SYNTHETIC = [
        'shipping-cost' => self::SHIPPING,
        'discount-percent' => self::DISCOUNT,
        'discount-amount' => self::DISCOUNT,
        'gift' => self::GIFT,
        'handel-cost' => self::HANDLING,
    ];

    /**
     * @param array<string, mixed> $item Decoded <Item> (e.g. Sku, PriceGross, PriceNet, Quantity, Percent).
     */
    public function classify(array $item): string
    {
        $sku = isset($item['Sku']) && is_scalar($item['Sku']) ? (string) $item['Sku'] : '';

        if (isset(self::KNOWN_SYNTHETIC[$sku])) {
            return self::KNOWN_SYNTHETIC[$sku];
        }

        if ($this->looksLikeSyntheticSlug($sku) || $this->hasNegativePrice($item)) {
            return self::UNKNOWN_SYNTHETIC;
        }

        return self::MERCHANDISE;
    }

    /**
     * All three confirmed synthetic SKUs are lowercase-letters-and-hyphens
     * "slugs" with no digits - unlike the confirmed real merchandise SKUs
     * seen so far ("sneakershieldL" has mixed case, "CW2288-111" has
     * uppercase and digits). This is a heuristic, not a confirmed UNAS
     * rule: an all-lowercase-letters merchandise SKU (rare, but the shop
     * could have one) would be misclassified as UNKNOWN_SYNTHETIC and
     * excluded from order_items rather than silently mispriced - see
     * ASSUMPTIONS.md for this tradeoff.
     */
    private function looksLikeSyntheticSlug(string $sku): bool
    {
        return $sku !== '' && preg_match('/^[a-z]+(-[a-z]+)*$/', $sku) === 1;
    }

    /**
     * A second, weaker safety net for a future synthetic row type that
     * doesn't follow the lowercase-slug naming convention: a negative
     * price is never valid for a real merchandise sale, so route it away
     * from MERCHANDISE even if the SKU itself looks like a normal one.
     */
    private function hasNegativePrice(array $item): bool
    {
        $gross = $item['PriceGross'] ?? null;

        return is_numeric($gross) && (float) $gross < 0;
    }
}
