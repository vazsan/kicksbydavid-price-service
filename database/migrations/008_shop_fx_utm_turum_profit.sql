-- =====================================================================
-- Migration 008: data fixes for the profit dashboard (F0/F1).
--
-- 1. orders: the shop face (UNAS <Lang>: hu = kicksbydavid.hu / HUF,
--    sk = kicksbydavid.sk / EUR), UNAS's own per-order <ExchangeValue>
--    (order-currency units per 1 EUR, e.g. 368.659 HUF), the net total
--    (sum of <PriceNet>), <Referer> and the <UTM> block.
--    exchange_rate_to_base was always left at its 1.0 default before this
--    migration, so a HUF order was read as if its forint amount were EUR.
--    The sync job now writes exchange_rate_to_base = 1 / ExchangeValue for
--    non-EUR orders; reporting divides by unas_exchange_value directly
--    (exact) and only falls back to exchange_rate_to_base.
-- 2. order_items: net unit price, plus a Turum CURRENT-price snapshot
--    captured once (never overwritten) the first time the item is seen
--    after a price import. For orders imported retroactively this
--    snapshot is the price on the import day, not the purchase price -
--    the dashboard labels COGS accordingly.
-- 3. turum_prices: Turum's current per-variant price/stock, keyed the
--    same way the fleet's arres.py / profit_month.py pair Unas SKUs with
--    Turum: UPPER(turum_sku + '-' + size with '.' -> '-').
-- 4. daily_profit gets a shop dimension (unique key (stat_date, shop))
--    and the extra columns the dashboard shows. The table was empty when
--    this was written (nothing ever populated it), so changing the unique
--    key loses nothing.
-- 5. Cost assumptions live in `settings` (group profit_costs) so they can
--    be changed without a deploy. An EMPTY value means "not provided" and
--    is shown as missing on the dashboard - it is never treated as zero.
--
-- MySQL 8 has no ADD COLUMN IF NOT EXISTS: apply once, via
-- scripts/migrate.php (which records it in schema_migrations).
-- =====================================================================

ALTER TABLE orders
    ADD COLUMN shop VARCHAR(8) NULL
        COMMENT 'UNAS <Lang> of the shop face the order came from: hu (kicksbydavid.hu) / sk (kicksbydavid.sk).'
        AFTER unas_order_key,
    ADD COLUMN unas_exchange_value DECIMAL(14,6) NULL
        COMMENT 'UNAS <ExchangeValue>: order-currency units per 1 base currency (EUR) at order time. NULL on EUR orders (UNAS omits it).'
        AFTER exchange_rate_to_base,
    ADD COLUMN grand_total_net DECIMAL(14,4) NULL
        COMMENT 'SUM(<PriceNet> * <Quantity>) over every <Item> row (merchandise and synthetic), order currency.'
        AFTER grand_total,
    ADD COLUMN referer VARCHAR(255) NULL
        COMMENT 'UNAS <Referer> verbatim (e.g. android-app:, https://www.google.com/).'
        AFTER payment_amount_paid,
    ADD COLUMN utm_source VARCHAR(255) NULL AFTER referer,
    ADD COLUMN utm_medium VARCHAR(255) NULL AFTER utm_source,
    ADD COLUMN utm_campaign VARCHAR(255) NULL AFTER utm_medium,
    ADD COLUMN utm_term VARCHAR(255) NULL AFTER utm_campaign,
    ADD COLUMN utm_content VARCHAR(255) NULL AFTER utm_term,
    ADD KEY idx_orders_shop_date (shop, order_date);

ALTER TABLE order_items
    ADD COLUMN unit_price_net DECIMAL(14,4) NULL
        COMMENT 'UNAS <PriceNet> per unit, order currency.'
        AFTER actual_price_per_unit,
    ADD COLUMN turum_unit_cost DECIMAL(14,4) NULL
        COMMENT 'Turum CURRENT price per unit, captured once when first matched (see migration 008 header). NULL = no Turum match.'
        AFTER line_total,
    ADD COLUMN turum_cost_currency CHAR(3) NULL AFTER turum_unit_cost,
    ADD COLUMN turum_cost_captured_at DATETIME NULL AFTER turum_cost_currency;

CREATE TABLE IF NOT EXISTS turum_prices (
    turum_key       VARCHAR(100)    NOT NULL PRIMARY KEY
        COMMENT 'UPPER(turum product sku + "-" + variant size with "." replaced by "-"), the Unas SKU it pairs with.',
    turum_sku       VARCHAR(64)     NOT NULL,
    size            VARCHAR(20)     NOT NULL,
    variant_id      VARCHAR(64)     NULL,
    price           DECIMAL(14,4)   NOT NULL,
    currency        CHAR(3)         NOT NULL DEFAULT 'EUR',
    stock           INT             NULL,
    source_fetched_at DATETIME      NULL COMMENT 'When the underlying Turum list was fetched (cache meta time).',
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_turum_prices_sku (turum_sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE daily_profit
    ADD COLUMN shop VARCHAR(8) NOT NULL DEFAULT 'all' AFTER stat_date,
    DROP INDEX uq_daily_profit_date,
    ADD UNIQUE KEY uq_daily_profit_date_shop (stat_date, shop),
    ADD COLUMN merchandise_revenue DECIMAL(14,2) NOT NULL DEFAULT 0 COMMENT 'Merchandise after discount, gross, base currency.' AFTER net_revenue,
    ADD COLUMN shipping_fee_charged DECIMAL(14,2) NOT NULL DEFAULT 0 COMMENT 'Shipping fee paid by customers.' AFTER merchandise_revenue,
    ADD COLUMN handling_fee_charged DECIMAL(14,2) NOT NULL DEFAULT 0 COMMENT 'COD handling fee (handel-cost) paid by customers.' AFTER shipping_fee_charged,
    ADD COLUMN revenue_native DECIMAL(16,2) NOT NULL DEFAULT 0 COMMENT 'Gross revenue of non-EUR (HUF) orders in their own currency.' AFTER handling_fee_charged,
    ADD COLUMN revenue_native_in_base DECIMAL(14,2) NOT NULL DEFAULT 0 COMMENT 'The same non-EUR orders converted to base - revenue_native / this = effective UNAS rate.' AFTER revenue_native,
    ADD COLUMN cogs_units_matched INT UNSIGNED NOT NULL DEFAULT 0 AFTER cogs,
    ADD COLUMN cogs_units_total INT UNSIGNED NOT NULL DEFAULT 0 AFTER cogs_units_matched,
    ADD COLUMN cogs_full_orders INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Orders whose every merchandise unit has a Turum cost.' AFTER cogs_units_total,
    ADD COLUMN cogs_full_revenue DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER cogs_full_orders,
    ADD COLUMN cogs_full_profit DECIMAL(14,2) NOT NULL DEFAULT 0 COMMENT 'Profit of the fully covered orders only.' AFTER cogs_full_revenue,
    ADD COLUMN shipping_cost_missing_orders INT UNSIGNED NOT NULL DEFAULT 0 AFTER shipping_cost,
    ADD COLUMN payment_fee_missing_orders INT UNSIGNED NOT NULL DEFAULT 0 AFTER payment_fees,
    ADD COLUMN orders_completed INT UNSIGNED NOT NULL DEFAULT 0 AFTER orders_count,
    ADD COLUMN orders_open INT UNSIGNED NOT NULL DEFAULT 0 AFTER orders_completed,
    ADD COLUMN orders_failed INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Cancelled/failed orders, NOT in revenue.' AFTER orders_open,
    ADD COLUMN failed_revenue DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER orders_failed;

-- Cost assumptions. Values from the owner's DPD Polska discount cards
-- (DPD Pickup Export, valid from 2026-04-01, EUR, excl. VAT, row
-- "Slowacja"): see DPD.md "Price list" for every tier and the source PDFs.
INSERT IGNORE INTO settings (setting_group, setting_key, setting_value, description, updated_at) VALUES
('profit_costs', 'fx.huf_per_eur_display', '370', 'HUF per EUR used for the dashboard "HUF (x370)" display mode (owner figure).', NOW()),
('profit_costs', 'shipping.sk.parcel_eur', '2.98', 'SK: DPD Pickup Export per-parcel price, 1-3 kg tier (EUR, excl. VAT). Tiers: <1kg 2.52, 1-3kg 2.98, 3-6kg 3.41, 6-10kg 4.03, 10-20kg 6.12.', NOW()),
('profit_costs', 'shipping.sk.security_fee_eur', '0.45', 'SK: DPD "oplata bezpieczenstwa" per parcel (EUR).', NOW()),
('profit_costs', 'shipping.sk.fuel_surcharge_pct', '', 'SK: DPD fuel surcharge %, published monthly on dpd.com.pl - NOT PROVIDED (empty = shown as missing, not 0).', NOW()),
('profit_costs', 'shipping.sk.cod_fee_eur', '7.30', 'SK: DPD COD service fee per COD parcel (EUR, Pickup Export card).', NOW()),
('profit_costs', 'shipping.hu.parcel_eur', '', 'HU: Packeta per-parcel cost (EUR) - NOT PROVIDED yet.', NOW()),
('profit_costs', 'shipping.hu.cod_fee_eur', '', 'HU: Packeta COD fee per COD parcel (EUR) - NOT PROVIDED yet.', NOW()),
('profit_costs', 'payment.card_pct', '', 'Card/online payment fee % of the order total - NOT PROVIDED yet.', NOW()),
('profit_costs', 'payment.card_fixed_eur', '', 'Card/online payment fixed fee per transaction (EUR) - NOT PROVIDED yet.', NOW()),
('profit_costs', 'payment.transfer_eur', '0', 'Bank transfer fee per order (EUR). 0 = assumed free; change if not.', NOW());
