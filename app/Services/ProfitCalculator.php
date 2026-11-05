<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Pure per-day, per-shop profit aggregation (F1). No I/O - the cron job
 * (cron/recalculate_profit.php) loads order rows and cost settings, this
 * class turns them into daily_profit rows. Unit tested in
 * tests/ProfitCalculatorTest.php.
 *
 * Money is converted to the base currency (EUR) per order with UNAS's own
 * <ExchangeValue> (order-currency units per 1 EUR, stored at order time).
 *
 * Profit (contribution, before ad spend) =
 *     gross revenue (SumPriceGross, incl. the shipping + COD fees the
 *     customer paid) - COGS - estimated carrier cost - payment fees.
 * Every cost part that is not known is LEFT OUT and counted as missing
 * (e.g. orders with no Turum match, HU Packeta cost not provided), so the
 * profit figure is an upper bound whenever a "missing" counter is > 0.
 * cogs_full_* repeats the calculation for only those orders whose every
 * merchandise unit has a Turum cost - the honest margin sample.
 */
final class ProfitCalculator
{
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_OPEN = 'open';
    public const STATUS_FAILED = 'failed';

    /** @param array<string, ?string> $settings profit_costs settings, '' / null = not provided */
    public function __construct(private readonly array $settings, private readonly string $baseCurrency = 'EUR')
    {
    }

    /**
     * Status bucket. UNAS StatusType values seen live: close_ok (closed,
     * delivered), open_normal / open_prepare (in progress), close_fault
     * (closed unsuccessfully). Status labels containing "törölt" /
     * "sikertelen" / "visszaküld" are treated as failed even when the
     * type says otherwise (same rule as the fleet's profit_month.py).
     * Failed orders are excluded from revenue and counted separately.
     */
    public function statusBucket(?string $statusType, ?string $status): string
    {
        $label = mb_strtolower((string) $status);
        foreach (['törölt', 'torolt', 'sikertelen', 'visszaküld', 'visszakuld', 'storno', 'zrušen'] as $needle) {
            if (str_contains($label, $needle)) {
                return self::STATUS_FAILED;
            }
        }
        $type = strtolower((string) $statusType);
        if ($type === 'close_ok') {
            return self::STATUS_COMPLETED;
        }
        if (str_starts_with($type, 'close_')) {
            return self::STATUS_FAILED;
        }
        return self::STATUS_OPEN;
    }

    /** Order-currency -> base-currency divisor (1.0 for base-currency orders). */
    public function fxDivisor(array $order): float
    {
        if (strtoupper((string) ($order['currency'] ?? '')) === strtoupper($this->baseCurrency)) {
            return 1.0;
        }
        $fx = $order['unas_exchange_value'] ?? null;
        if (is_numeric($fx) && (float) $fx > 0) {
            return (float) $fx;
        }
        $rate = $order['exchange_rate_to_base'] ?? null;
        if (is_numeric($rate) && (float) $rate > 0 && abs((float) $rate - 1.0) > 1e-9) {
            return 1 / (float) $rate;
        }
        // Last resort for a non-EUR order without any stored rate: the
        // owner's display rate. Counted in fx_fallback_orders.
        return $this->num('fx.huf_per_eur_display') ?? 370.0;
    }

    private function num(string $key): ?float
    {
        $v = $this->settings[$key] ?? null;
        if ($v === null || trim((string) $v) === '' || !is_numeric(trim((string) $v))) {
            return null;
        }
        return (float) trim((string) $v);
    }

    /**
     * Estimated carrier cost of one order in EUR, or null if the needed
     * price is not provided. SK = DPD Pickup Export (owner's discount
     * card), HU = Packeta (not provided yet). COD parcels add the
     * carrier's COD fee.
     *
     * @return array{cost: ?float, missing: bool}
     */
    public function shippingCost(array $order): array
    {
        $shop = strtolower((string) ($order['shop'] ?? ''));
        if (!in_array($shop, ['hu', 'sk'], true)) {
            return ['cost' => null, 'missing' => true];
        }
        $parcel = $this->num("shipping.$shop.parcel_eur");
        if ($parcel === null) {
            return ['cost' => null, 'missing' => true];
        }
        if ($this->isHomeDelivery($order)) {
            // Home delivery has its own (optional) setting; empty = missing.
            $parcel = $this->num("shipping.$shop.home_parcel_eur");
            if ($parcel === null) {
                return ['cost' => null, 'missing' => true];
            }
        }
        $cost = $parcel + ($this->num("shipping.$shop.security_fee_eur") ?? 0.0);
        $fuel = $this->num("shipping.$shop.fuel_surcharge_pct");
        if ($fuel !== null) {
            $cost += $parcel * $fuel / 100;
        }
        $missing = false;
        if ($this->isCod($order)) {
            $cod = $this->num("shipping.$shop.cod_fee_eur");
            if ($cod === null) {
                $missing = true;
            } else {
                $cost += $cod;
            }
        }
        return ['cost' => $cost, 'missing' => $missing];
    }

    /**
     * COD detection. Confirmed live (2026-10/11 orders): most COD orders
     * come with Payment Type "other" and Name "Utánvét (+1.100 ft)", only
     * some with Type "cod" - so the name is checked too.
     */
    public function isCod(array $order): bool
    {
        if (strtolower((string) ($order['payment_method'] ?? '')) === 'cod') {
            return true;
        }
        $name = mb_strtolower((string) ($order['payment_name'] ?? ''));
        return str_contains($name, 'utánvét') || str_contains($name, 'utanvet') || str_contains($name, 'dobierk');
    }

    /** Shipping method names seen live: "DPD HÁZHOZSZÁLLITÁS", "Packeta- Házhozszállítás" vs "... csomagpont(ok)". */
    public function isHomeDelivery(array $order): bool
    {
        $name = mb_strtolower((string) ($order['shipping_method'] ?? ''));
        return str_contains($name, 'házhoz') || str_contains($name, 'hazhoz') || str_contains($name, 'kuriér') || str_contains($name, 'na adresu');
    }

    /**
     * Payment provider fee in EUR. COD has no separate provider fee (the
     * carrier's COD fee is in shippingCost()). Live payment methods
     * (2026-10/11): "bankcard" = "Stripe-Biztonságos Bankkártyás fizetés"
     * (card fee), "other"/"cod" = "Utánvét" (COD). A bank transfer uses
     * payment.transfer_eur. Anything unrecognized is counted as missing.
     *
     * @return array{cost: ?float, missing: bool}
     */
    public function paymentFee(array $order, float $revenueBase): array
    {
        if ($this->isCod($order)) {
            return ['cost' => 0.0, 'missing' => false];
        }
        $method = strtolower((string) ($order['payment_method'] ?? ''));
        $name = mb_strtolower((string) ($order['payment_name'] ?? ''));
        $isCard = str_contains($method, 'card') || str_contains($name, 'kártya') || str_contains($name, 'karta')
            || str_contains($name, 'stripe') || str_contains($name, 'paypal') || str_contains($name, 'barion');
        if ($isCard) {
            $pct = $this->num('payment.card_pct');
            $fixed = $this->num('payment.card_fixed_eur');
            if ($pct === null && $fixed === null) {
                return ['cost' => null, 'missing' => true];
            }
            return ['cost' => $revenueBase * ($pct ?? 0.0) / 100 + ($fixed ?? 0.0), 'missing' => false];
        }
        if ($method === 'transfer' || str_contains($name, 'átutal') || str_contains($name, 'prevod') || str_contains($name, 'transfer')) {
            $fee = $this->num('payment.transfer_eur');
            return ['cost' => $fee, 'missing' => $fee === null];
        }
        return ['cost' => null, 'missing' => true];
    }

    /**
     * @param iterable<array<string, mixed>> $orders Rows with: order_date, shop, currency,
     *     unas_exchange_value, exchange_rate_to_base, grand_total, grand_total_net,
     *     subtotal, shipping_fee_charged, discount_total, handling_total, status_type,
     *     status, payment_method, payment_name, shipping_method, units_total, units_matched, cogs_matched (EUR).
     * @return array<string, array<string, float|int|string>> keyed "Y-m-d|shop"
     */
    public function aggregate(iterable $orders): array
    {
        $days = [];
        foreach ($orders as $o) {
            $date = substr((string) $o['order_date'], 0, 10);
            $shop = strtolower((string) ($o['shop'] ?? '')) ?: 'unknown';
            $key = $date . '|' . $shop;
            $d = $days[$key] ??= $this->emptyRow($date, $shop);

            $div = $this->fxDivisor($o);
            $isBase = strtoupper((string) ($o['currency'] ?? '')) === strtoupper($this->baseCurrency);
            $gross = (float) ($o['grand_total'] ?? 0) / $div;
            $bucket = $this->statusBucket($o['status_type'] ?? null, $o['status'] ?? null);

            if ($bucket === self::STATUS_FAILED) {
                $d['orders_failed']++;
                $d['failed_revenue'] += $gross;
                $days[$key] = $d;
                continue;
            }

            if (!$isBase && !(is_numeric($o['unas_exchange_value'] ?? null) && (float) $o['unas_exchange_value'] > 0)) {
                $d['fx_fallback_orders']++;
            }
            $net = is_numeric($o['grand_total_net'] ?? null) ? (float) $o['grand_total_net'] / $div : $gross;
            $unitsTotal = (int) ($o['units_total'] ?? 0);
            $unitsMatched = (int) ($o['units_matched'] ?? 0);
            $cogs = (float) ($o['cogs_matched'] ?? 0);
            $ship = $this->shippingCost($o);
            $fee = $this->paymentFee($o, $gross);
            $profit = $gross - $cogs - ($ship['cost'] ?? 0.0) - ($fee['cost'] ?? 0.0);

            $d['orders_count']++;
            $d[$bucket === self::STATUS_COMPLETED ? 'orders_completed' : 'orders_open']++;
            $d['revenue'] += $gross;
            $d['net_revenue'] += $net;
            $d['merchandise_revenue'] += ((float) ($o['subtotal'] ?? 0) - (float) ($o['discount_total'] ?? 0)) / $div;
            $d['shipping_fee_charged'] += (float) ($o['shipping_fee_charged'] ?? 0) / $div;
            $d['handling_fee_charged'] += (float) ($o['handling_total'] ?? 0) / $div;
            $d['discount_total'] += (float) ($o['discount_total'] ?? 0) / $div;
            if (!$isBase) {
                $d['revenue_native'] += (float) ($o['grand_total'] ?? 0);
                $d['revenue_native_in_base'] += $gross;
            }
            $d['units_sold'] += $unitsTotal;
            $d['cogs'] += $cogs;
            $d['cogs_units_matched'] += $unitsMatched;
            $d['cogs_units_total'] += $unitsTotal;
            if ($unitsTotal > 0 && $unitsMatched >= $unitsTotal) {
                $d['cogs_full_orders']++;
                $d['cogs_full_revenue'] += $gross;
                $d['cogs_full_profit'] += $profit;
            }
            $d['shipping_cost'] += $ship['cost'] ?? 0.0;
            $d['shipping_cost_missing_orders'] += ($ship['missing'] || $ship['cost'] === null) ? 1 : 0;
            $d['payment_fees'] += $fee['cost'] ?? 0.0;
            $d['payment_fee_missing_orders'] += $fee['missing'] ? 1 : 0;
            $d['gross_profit'] += $gross - $cogs;
            $d['contribution_profit'] += $profit;
            $days[$key] = $d;
        }
        ksort($days);
        return $days;
    }

    /** @return array<string, float|int|string> */
    private function emptyRow(string $date, string $shop): array
    {
        return [
            'stat_date' => $date, 'shop' => $shop,
            'revenue' => 0.0, 'net_revenue' => 0.0, 'merchandise_revenue' => 0.0,
            'shipping_fee_charged' => 0.0, 'handling_fee_charged' => 0.0, 'discount_total' => 0.0,
            'revenue_native' => 0.0, 'revenue_native_in_base' => 0.0,
            'cogs' => 0.0, 'cogs_units_matched' => 0, 'cogs_units_total' => 0,
            'cogs_full_orders' => 0, 'cogs_full_revenue' => 0.0, 'cogs_full_profit' => 0.0,
            'gross_profit' => 0.0, 'ad_spend' => 0.0,
            'payment_fees' => 0.0, 'payment_fee_missing_orders' => 0,
            'shipping_cost' => 0.0, 'shipping_cost_missing_orders' => 0,
            'contribution_profit' => 0.0,
            'orders_count' => 0, 'orders_completed' => 0, 'orders_open' => 0, 'orders_failed' => 0,
            'failed_revenue' => 0.0, 'units_sold' => 0, 'fx_fallback_orders' => 0,
        ];
    }
}
