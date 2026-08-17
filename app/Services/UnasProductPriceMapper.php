<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Pure price extraction from a decoded UNAS <Product><Prices><Price>
 * block. No I/O - kept separate from cron/sync_unas_products.php
 * specifically so it can be unit tested without a database or a live
 * API call - see tests/, mirroring UnasOrderMapper's role for orders.
 *
 * CONFIRMED (production bug fix): <Actual> is NOT a monetary amount - it
 * is a flag ("1") marking which <Price> row is the currently active/
 * effective one. Treating it as a price (the previous behavior) produced
 * wrong data: SKU FZ4625-100-11's row
 * <Type>normal</Type><Gross>189</Gross><Actual>1</Actual> was stored as
 * list_price=189, current_price=1 - "1" being the flag, not a forint/
 * euro amount. The monetary amount for any row is always <Gross>.
 */
final class UnasProductPriceMapper
{
    /**
     * UNAS's XML-to-array decoding collapses a single repeated child
     * element into an associative array (not a list) - the same quirk
     * UnasOrderMapper::normalizeToList() handles for orders.
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

    /**
     *   list_price    = <Gross> of the Type=normal row (catalog/list price).
     *   current_price = <Gross> of whichever row has <Actual>=1 (the row
     *                   UNAS flags as currently effective - this is how a
     *                   real sale price would surface, without this code
     *                   inventing any sale-price concept of its own: it
     *                   just reads whichever row is flagged).
     *
     * If no row is flagged Actual=1 (unconfirmed/absent flag, or only
     * one row exists and it isn't flagged), current_price falls back to
     * list_price - there is no evidence of a different current price in
     * that case, so none is invented. If <Gross> itself is missing/
     * malformed on the relevant row(s), the corresponding value is null
     * rather than guessed.
     *
     * @param array<string, mixed> $product Decoded <Product> (only ['Prices']['Price'] is read).
     * @return array{list_price: ?string, current_price: ?string}
     */
    public function extractPrice(array $product): array
    {
        $priceRows = $this->normalizeToList($product['Prices']['Price'] ?? null);

        $listPrice = null;
        foreach ($priceRows as $row) {
            if (($row['Type'] ?? null) === 'normal') {
                $listPrice = $this->grossOf($row);
                break;
            }
        }

        $currentPrice = null;
        $activeRowFound = false;
        foreach ($priceRows as $row) {
            if ($this->isActive($row)) {
                $activeRowFound = true;
                $currentPrice = $this->grossOf($row);
                break;
            }
        }

        // Fall back to list_price only when NO row was flagged Actual=1
        // at all (no evidence of a different current price). If a row
        // WAS flagged but its own <Gross> is missing/malformed, that is
        // a real data problem on the row UNAS said to trust - surface it
        // as null rather than silently substituting an unrelated row's
        // price.
        return [
            'list_price' => $listPrice,
            'current_price' => $activeRowFound ? $currentPrice : $listPrice,
        ];
    }

    private function grossOf(array $row): ?string
    {
        return isset($row['Gross']) && is_numeric($row['Gross']) ? (string) $row['Gross'] : null;
    }

    private function isActive(array $row): bool
    {
        return isset($row['Actual']) && is_numeric($row['Actual']) && (int) $row['Actual'] === 1;
    }
}
