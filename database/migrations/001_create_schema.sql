-- =====================================================================
-- Profit Analytics System - initial schema (V1)
-- Engine: MySQL 8 / MariaDB 10.4+, InnoDB, utf8mb4
--
-- Conventions used throughout this schema:
--   * All monetary columns are DECIMAL, never FLOAT/DOUBLE, to avoid
--     binary floating point rounding errors in financial calculations.
--     DECIMAL(14,4) is used for unit-level amounts (prices, costs, fees)
--     to keep sub-cent precision through percentage calculations;
--     DECIMAL(14,2) is used for already-rounded, order/day-level totals.
--   * Every transactional (money-bearing) table stores its own `currency`
--     and, where a cross-currency rollup could apply, its own
--     `exchange_rate_to_base` at the time of the transaction - so a
--     historical number can always be reproduced even if the shop's base
--     currency or FX rates change later (see ARCHITECTURE.md - Currency).
--   * created_at / updated_at are present on every table that represents
--     a mutable business record, for auditability.
--   * Foreign keys use ON DELETE RESTRICT by default (financial history
--     should not silently disappear because a parent row was deleted);
--     ON DELETE CASCADE is used only for pure child/detail rows that have
--     no meaning without their parent (e.g. order_items -> orders).
-- =====================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------------
-- users - admin panel accounts
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(120)        NOT NULL,
    email               VARCHAR(190)        NOT NULL,
    password_hash       VARCHAR(255)        NOT NULL,
    role                ENUM('admin','viewer') NOT NULL DEFAULT 'admin',
    is_active           TINYINT(1)          NOT NULL DEFAULT 1,
    last_login_at       DATETIME            NULL,
    created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- settings - key/value application configuration editable from the UI
-- (payment fee rules, status thresholds, etc.) so they are not hardcoded.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_group       VARCHAR(60)         NOT NULL,
    setting_key         VARCHAR(120)        NOT NULL,
    setting_value       TEXT                NULL,
    description         VARCHAR(255)        NULL,
    updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_settings_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- suppliers
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(150)        NOT NULL,
    inventory_source    ENUM('OWN','EXTERNAL','TURUM','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    contact_info        VARCHAR(255)        NULL,
    is_active           TINYINT(1)          NOT NULL DEFAULT 1,
    created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- products - the "parent" product as it exists in UNAS (e.g. "DD1391-100").
-- Actual sellable/stockable units are SKUs, stored in product_variants.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    unas_product_id     VARCHAR(64)         NULL,
    name                VARCHAR(255)        NOT NULL,
    brand               VARCHAR(120)        NULL,
    category            VARCHAR(150)        NULL,
    default_inventory_source ENUM('OWN','EXTERNAL','TURUM','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    status              ENUM('SCALE','WATCH','STOP','LOSS','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    status_calculated_at DATETIME           NULL,
    is_active           TINYINT(1)          NOT NULL DEFAULT 1,
    created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_products_unas_id (unas_product_id),
    KEY idx_products_status (status),
    KEY idx_products_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- product_variants - SKU level. This is the true sellable/stockable unit
-- (e.g. DD1391-100-42, DD1391-100-425, DD1391-100-43 are three separate
-- rows belonging to the same product_id).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id          BIGINT UNSIGNED     NOT NULL,
    unas_variant_id     VARCHAR(64)         NULL,
    sku                 VARCHAR(64)         NOT NULL,
    size                VARCHAR(30)         NULL,
    color               VARCHAR(60)         NULL,
    barcode             VARCHAR(64)         NULL,
    list_price          DECIMAL(14,4)       NULL,
    currency            CHAR(3)             NOT NULL DEFAULT 'EUR',
    inventory_source    ENUM('OWN','EXTERNAL','TURUM','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    current_stock_cached INT                NOT NULL DEFAULT 0
        COMMENT 'Last known stock as reported by UNAS; informational only. Real FIFO stock = SUM(inventory_batches.quantity_remaining).',
    is_active           TINYINT(1)          NOT NULL DEFAULT 1,
    created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_variants_sku (sku),
    KEY idx_variants_product (product_id),
    CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- orders - one row per UNAS order. unas_order_id is the de-dupe key for
-- sync jobs (INSERT ... ON DUPLICATE KEY UPDATE against it).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    unas_order_id       VARCHAR(64)         NOT NULL,
    order_number        VARCHAR(64)         NULL,
    order_date          DATETIME            NOT NULL,
    status              VARCHAR(40)         NOT NULL DEFAULT 'unknown'
        COMMENT 'Normalized UNAS order status, e.g. pending/confirmed/shipped/cancelled/refunded.',
    is_cancelled        TINYINT(1)          NOT NULL DEFAULT 0,
    currency            CHAR(3)             NOT NULL DEFAULT 'EUR',
    exchange_rate_to_base DECIMAL(14,6)     NOT NULL DEFAULT 1.000000,
    customer_email      VARCHAR(190)        NULL,
    customer_country    CHAR(2)             NULL,
    payment_method      VARCHAR(60)         NULL,
    shipping_method     VARCHAR(60)         NULL,
    shipping_fee_charged DECIMAL(14,4)      NOT NULL DEFAULT 0
        COMMENT 'What the customer paid for shipping.',
    actual_shipping_cost DECIMAL(14,4)      NULL
        COMMENT 'Real carrier cost for this order, if known; otherwise ProfitService estimates it from the shipping_costs rate table.',
    discount_total       DECIMAL(14,4)      NOT NULL DEFAULT 0,
    subtotal             DECIMAL(14,4)      NOT NULL DEFAULT 0,
    grand_total          DECIMAL(14,4)      NOT NULL DEFAULT 0,
    raw_payload          JSON                NULL COMMENT 'Full raw UNAS API response for this order, kept for audit/debugging.',
    imported_at          DATETIME            NULL,
    created_at           DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_orders_unas_id (unas_order_id),
    KEY idx_orders_date (order_date),
    KEY idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- order_items - order lines. sku/product_name are denormalized so a line
-- still reads correctly even if it arrived before the matching
-- product_variant existed yet (variant gets linked on the next sync).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id            BIGINT UNSIGNED     NOT NULL,
    product_variant_id  BIGINT UNSIGNED     NULL,
    sku                 VARCHAR(64)         NOT NULL,
    product_name        VARCHAR(255)        NOT NULL,
    quantity             INT UNSIGNED        NOT NULL DEFAULT 1,
    list_price_per_unit  DECIMAL(14,4)       NOT NULL DEFAULT 0
        COMMENT 'Catalog price before discount.',
    actual_price_per_unit DECIMAL(14,4)      NOT NULL DEFAULT 0
        COMMENT 'What was actually charged per unit, i.e. AFTER discount. Never subtract discount from this again downstream (see ProfitService).',
    discount_amount      DECIMAL(14,4)       NOT NULL DEFAULT 0
        COMMENT 'Line-level discount total, informational/reporting only.',
    line_total            DECIMAL(14,4)       NOT NULL DEFAULT 0
        COMMENT 'actual_price_per_unit * quantity.',
    currency               CHAR(3)             NOT NULL DEFAULT 'EUR',
    created_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_items_order (order_id),
    KEY idx_items_variant (product_variant_id),
    KEY idx_items_sku (sku),
    CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_items_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- inventory_batches - FIFO cost lots. One row per purchase lot; quantity_
-- remaining is decremented as sales consume it (oldest batch first).
-- Created from an accepted purchase_costs row (manual entry or CSV
-- import), 1:1 at insert time.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_batches (
    id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_variant_id    BIGINT UNSIGNED     NOT NULL,
    supplier_id           BIGINT UNSIGNED     NULL,
    purchase_date         DATE                NOT NULL,
    quantity_purchased    INT UNSIGNED        NOT NULL,
    quantity_remaining    INT UNSIGNED        NOT NULL
        COMMENT 'Decremented by inventory_movements of type SALE, incremented by RETURN_RESTOCK.',
    unit_cost             DECIMAL(14,4)       NOT NULL,
    currency               CHAR(3)             NOT NULL DEFAULT 'EUR',
    exchange_rate_to_base   DECIMAL(14,6)       NOT NULL DEFAULT 1.000000,
    inventory_source         ENUM('OWN','EXTERNAL','TURUM','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    source_reference           VARCHAR(64)         NULL COMMENT 'CSV import batch id, manual, PO number, etc.',
    notes                       VARCHAR(255)        NULL,
    created_at                   DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                   DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_batches_variant_fifo (product_variant_id, purchase_date, id)
        COMMENT 'Supports "oldest batch with remaining stock first" FIFO lookups.',
    CONSTRAINT fk_batches_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants (id) ON DELETE RESTRICT,
    CONSTRAINT fk_batches_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE SET NULL,
    CONSTRAINT chk_batches_remaining_nonneg CHECK (quantity_remaining >= 0),
    CONSTRAINT chk_batches_remaining_le_purchased CHECK (quantity_remaining <= quantity_purchased)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- purchase_costs - append-only ledger of every cost entry submitted
-- (manual form or CSV import). Each accepted row creates exactly one
-- inventory_batches row; keeping this separate table preserves the
-- original import record (who/when/how) even if the batch is later
-- adjusted.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_costs (
    id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_variant_id   BIGINT UNSIGNED     NOT NULL,
    inventory_batch_id   BIGINT UNSIGNED     NULL,
    supplier_id          BIGINT UNSIGNED     NULL,
    purchase_date        DATE                NOT NULL,
    quantity              INT UNSIGNED        NOT NULL,
    unit_cost             DECIMAL(14,4)       NOT NULL,
    currency               CHAR(3)             NOT NULL DEFAULT 'EUR',
    exchange_rate_to_base  DECIMAL(14,6)       NOT NULL DEFAULT 1.000000,
    inventory_source        ENUM('OWN','EXTERNAL','TURUM','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    import_source            ENUM('MANUAL','CSV','API') NOT NULL DEFAULT 'MANUAL',
    import_batch_reference    VARCHAR(64)         NULL COMMENT 'Groups rows from the same CSV upload.',
    created_by_user_id         BIGINT UNSIGNED     NULL,
    created_at                  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_purchase_costs_variant (product_variant_id),
    KEY idx_purchase_costs_date (purchase_date),
    CONSTRAINT fk_purchase_costs_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants (id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_costs_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE SET NULL,
    CONSTRAINT fk_purchase_costs_batch FOREIGN KEY (inventory_batch_id) REFERENCES inventory_batches (id) ON DELETE SET NULL,
    CONSTRAINT fk_purchase_costs_user FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- inventory_movements - audit trail of every quantity change against a
-- batch (a sale consuming stock, a return restocking it, a manual
-- correction). This is what makes FIFO COGS reproducible: a given
-- order_item's COGS can always be recomputed as
-- SUM(unit_cost_snapshot * -quantity) for its SALE movements.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_movements (
    id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    inventory_batch_id    BIGINT UNSIGNED     NOT NULL,
    order_item_id         BIGINT UNSIGNED     NULL,
    movement_type         ENUM('SALE','RETURN_RESTOCK','ADJUSTMENT','MANUAL') NOT NULL,
    quantity               INT                 NOT NULL COMMENT 'Negative = stock leaving the batch (sale), positive = stock returning to it.',
    unit_cost_snapshot      DECIMAL(14,4)       NOT NULL COMMENT 'Copy of the batch unit_cost at the moment of the movement.',
    note                     VARCHAR(255)        NULL,
    created_at                DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_movements_batch (inventory_batch_id),
    KEY idx_movements_item (order_item_id),
    CONSTRAINT fk_movements_batch FOREIGN KEY (inventory_batch_id) REFERENCES inventory_batches (id) ON DELETE RESTRICT,
    CONSTRAINT fk_movements_item FOREIGN KEY (order_item_id) REFERENCES order_items (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- shipping_costs - configurable rate table per carrier/method, used by
-- ProfitService to estimate actual_shipping_cost when an order doesn't
-- carry a real carrier invoice amount.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipping_costs (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(100)        NOT NULL COMMENT 'e.g. "Packeta Z-BOX", "Packeta Home", "UPS", "Free Shipping".',
    shipping_method_key VARCHAR(60)         NOT NULL COMMENT 'Matches orders.shipping_method for lookup.',
    cost_type           ENUM('FIXED','PERCENTAGE','FIXED_PLUS_PERCENTAGE') NOT NULL DEFAULT 'FIXED',
    fixed_amount        DECIMAL(14,4)       NOT NULL DEFAULT 0,
    percentage_amount   DECIMAL(6,3)        NOT NULL DEFAULT 0 COMMENT 'Percentage of order subtotal, if cost_type uses it.',
    currency             CHAR(3)             NOT NULL DEFAULT 'EUR',
    effective_from        DATE                NULL,
    effective_to          DATE                NULL,
    is_active              TINYINT(1)          NOT NULL DEFAULT 1,
    created_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_shipping_costs_method (shipping_method_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- payment_fees - configurable rate table per payment method.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_fees (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    payment_method_key  VARCHAR(60)         NOT NULL COMMENT 'Matches orders.payment_method, e.g. "stripe", "cod", "bank_transfer".',
    label               VARCHAR(100)        NOT NULL,
    fee_type            ENUM('FIXED','PERCENTAGE','FIXED_PLUS_PERCENTAGE') NOT NULL DEFAULT 'PERCENTAGE',
    fixed_amount        DECIMAL(14,4)       NOT NULL DEFAULT 0,
    percentage_amount   DECIMAL(6,3)        NOT NULL DEFAULT 0,
    currency             CHAR(3)             NOT NULL DEFAULT 'EUR',
    effective_from        DATE                NULL,
    effective_to          DATE                NULL,
    is_active              TINYINT(1)          NOT NULL DEFAULT 1,
    created_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_payment_fees_method (payment_method_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- product_returns - a customer sending goods back. Distinct from refunds:
-- a return is about the physical goods (and optionally its handling cost
-- and whether it was restocked); a refund is about the money.
-- NOTE: named "product_returns" rather than the spec's plain "returns"
-- because RETURNS is a reserved word in MySQL/MariaDB (used in
-- CREATE FUNCTION ... RETURNS syntax) - see ASSUMPTIONS.md.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_returns (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id            BIGINT UNSIGNED     NOT NULL,
    order_item_id       BIGINT UNSIGNED     NULL,
    return_date         DATE                NOT NULL,
    quantity             INT UNSIGNED        NOT NULL DEFAULT 1,
    reason                VARCHAR(255)        NULL,
    return_cost           DECIMAL(14,4)       NOT NULL DEFAULT 0 COMMENT 'Extra handling/return-shipping cost incurred.',
    currency               CHAR(3)             NOT NULL DEFAULT 'EUR',
    restocked                TINYINT(1)          NOT NULL DEFAULT 0,
    status                    ENUM('PENDING','APPROVED','REJECTED','COMPLETED') NOT NULL DEFAULT 'PENDING',
    created_at                 DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_product_returns_order (order_id),
    KEY idx_product_returns_item (order_item_id),
    CONSTRAINT fk_product_returns_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_product_returns_item FOREIGN KEY (order_item_id) REFERENCES order_items (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- refunds - money given back to the customer (full, partial, shipping-
-- only, etc). A cancelled order is modeled via orders.is_cancelled, not
-- as a refund row; a *paid-then-cancelled* order additionally gets a
-- FULL refund row here so the money reversal is auditable.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refunds (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id            BIGINT UNSIGNED     NOT NULL,
    order_item_id       BIGINT UNSIGNED     NULL,
    refund_date          DATE                NOT NULL,
    amount                 DECIMAL(14,4)       NOT NULL,
    currency                CHAR(3)             NOT NULL DEFAULT 'EUR',
    exchange_rate_to_base    DECIMAL(14,6)       NOT NULL DEFAULT 1.000000,
    refund_type               ENUM('FULL','PARTIAL','SHIPPING_ONLY','OTHER') NOT NULL DEFAULT 'PARTIAL',
    reason                     VARCHAR(255)        NULL,
    created_at                  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                   DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_refunds_order (order_id),
    KEY idx_refunds_item (order_item_id),
    CONSTRAINT fk_refunds_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_refunds_item FOREIGN KEY (order_item_id) REFERENCES order_items (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- other_costs - catch-all for the "Other Variable Costs" line in the
-- profit formula (ARCHITECTURE.md). Not in the client's minimum table
-- list but required for the formula to be complete; documented in
-- ASSUMPTIONS.md.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS other_costs (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id            BIGINT UNSIGNED     NULL,
    product_variant_id  BIGINT UNSIGNED     NULL,
    cost_date            DATE                NOT NULL,
    category               VARCHAR(60)         NOT NULL COMMENT 'e.g. packaging, marketplace_fee, tool_subscription.',
    amount                  DECIMAL(14,4)       NOT NULL,
    currency                 CHAR(3)             NOT NULL DEFAULT 'EUR',
    note                       VARCHAR(255)        NULL,
    created_at                  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                   DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_other_costs_order (order_id),
    KEY idx_other_costs_variant (product_variant_id),
    KEY idx_other_costs_date (cost_date),
    CONSTRAINT fk_other_costs_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_other_costs_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Meta (Facebook/Instagram) Ads - reserved for a later phase (V4), but
-- created now so the schema doesn't need a breaking migration later.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meta_campaigns (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    meta_campaign_id    VARCHAR(64)         NOT NULL,
    name                VARCHAR(255)        NOT NULL,
    objective            VARCHAR(60)         NULL,
    status                 VARCHAR(30)         NULL,
    created_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_meta_campaigns_id (meta_campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS meta_adsets (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    meta_adset_id       VARCHAR(64)         NOT NULL,
    meta_campaign_id    BIGINT UNSIGNED     NOT NULL,
    name                VARCHAR(255)        NOT NULL,
    status                 VARCHAR(30)         NULL,
    created_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_meta_adsets_id (meta_adset_id),
    KEY idx_meta_adsets_campaign (meta_campaign_id),
    CONSTRAINT fk_meta_adsets_campaign FOREIGN KEY (meta_campaign_id) REFERENCES meta_campaigns (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS meta_ads (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    meta_ad_id          VARCHAR(64)         NOT NULL,
    meta_adset_id       BIGINT UNSIGNED     NOT NULL,
    name                VARCHAR(255)        NOT NULL,
    status                 VARCHAR(30)         NULL,
    product_variant_id      BIGINT UNSIGNED     NULL COMMENT 'Optional mapping of an ad to the SKU/product it promotes.',
    created_at                DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                 DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_meta_ads_id (meta_ad_id),
    KEY idx_meta_ads_adset (meta_adset_id),
    KEY idx_meta_ads_variant (product_variant_id),
    CONSTRAINT fk_meta_ads_adset FOREIGN KEY (meta_adset_id) REFERENCES meta_adsets (id) ON DELETE CASCADE,
    CONSTRAINT fk_meta_ads_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS meta_daily_stats (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    meta_ad_id          BIGINT UNSIGNED     NOT NULL,
    stat_date           DATE                NOT NULL,
    spend                DECIMAL(14,4)       NOT NULL DEFAULT 0,
    impressions            BIGINT UNSIGNED     NOT NULL DEFAULT 0,
    reach                    BIGINT UNSIGNED     NOT NULL DEFAULT 0,
    clicks                     BIGINT UNSIGNED     NOT NULL DEFAULT 0,
    purchases                    INT UNSIGNED        NOT NULL DEFAULT 0,
    purchase_value                 DECIMAL(14,4)       NOT NULL DEFAULT 0,
    currency                         CHAR(3)             NOT NULL DEFAULT 'EUR',
    created_at                        DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                         DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_meta_daily_stats (meta_ad_id, stat_date),
    CONSTRAINT fk_meta_daily_stats_ad FOREIGN KEY (meta_ad_id) REFERENCES meta_ads (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Google Ads - reserved for a later phase (V5).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS google_campaigns (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    google_campaign_id  VARCHAR(64)         NOT NULL,
    name                VARCHAR(255)        NOT NULL,
    campaign_type        VARCHAR(60)         NULL COMMENT 'e.g. Performance Max, Search, Shopping.',
    status                  VARCHAR(30)         NULL,
    created_at                DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                 DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_google_campaigns_id (google_campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS google_daily_stats (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    google_campaign_id  BIGINT UNSIGNED     NOT NULL,
    stat_date           DATE                NOT NULL,
    spend                 DECIMAL(14,4)       NOT NULL DEFAULT 0,
    impressions             BIGINT UNSIGNED     NOT NULL DEFAULT 0,
    clicks                    BIGINT UNSIGNED     NOT NULL DEFAULT 0,
    conversions                 DECIMAL(14,4)       NOT NULL DEFAULT 0,
    conversion_value               DECIMAL(14,4)       NOT NULL DEFAULT 0,
    currency                         CHAR(3)             NOT NULL DEFAULT 'EUR',
    created_at                         DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_google_daily_stats (google_campaign_id, stat_date),
    CONSTRAINT fk_google_daily_stats_campaign FOREIGN KEY (google_campaign_id) REFERENCES google_campaigns (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- exchange_rates - optional reference table of daily FX rates used to
-- populate the exchange_rate_to_base columns above. Not strictly
-- required (each transaction already stores its own rate) but useful
-- for filling that column consistently during import.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exchange_rates (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rate_date           DATE                NOT NULL,
    from_currency       CHAR(3)             NOT NULL,
    to_currency         CHAR(3)             NOT NULL,
    rate                 DECIMAL(14,6)       NOT NULL,
    source                  VARCHAR(60)         NULL COMMENT 'e.g. ECB, manual.',
    created_at                DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_exchange_rates (rate_date, from_currency, to_currency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- daily_profit - precomputed daily aggregate cache (in base currency),
-- rebuilt by cron/recalculate_profit.php, so the dashboard never has to
-- re-run the full profit calculation across raw orders on every page
-- load. Always reproducible from the underlying tables.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_profit (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    stat_date           DATE                NOT NULL,
    revenue              DECIMAL(14,2)       NOT NULL DEFAULT 0,
    net_revenue            DECIMAL(14,2)       NOT NULL DEFAULT 0,
    cogs                     DECIMAL(14,2)       NOT NULL DEFAULT 0,
    gross_profit               DECIMAL(14,2)       NOT NULL DEFAULT 0,
    ad_spend                     DECIMAL(14,2)       NOT NULL DEFAULT 0,
    payment_fees                   DECIMAL(14,2)       NOT NULL DEFAULT 0,
    shipping_cost                    DECIMAL(14,2)       NOT NULL DEFAULT 0,
    discount_total                     DECIMAL(14,2)       NOT NULL DEFAULT 0,
    refund_total                         DECIMAL(14,2)       NOT NULL DEFAULT 0,
    return_cost_total                      DECIMAL(14,2)       NOT NULL DEFAULT 0,
    other_variable_costs                     DECIMAL(14,2)       NOT NULL DEFAULT 0,
    contribution_profit                        DECIMAL(14,2)       NOT NULL DEFAULT 0,
    orders_count                                 INT UNSIGNED        NOT NULL DEFAULT 0,
    units_sold                                     INT UNSIGNED        NOT NULL DEFAULT 0,
    currency                                         CHAR(3)             NOT NULL DEFAULT 'EUR' COMMENT 'Always the app base currency.',
    calculated_at                                      DATETIME            NULL,
    created_at                                           DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                                            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_daily_profit_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- api_logs - every outbound call to an external API (UNAS/Meta/Google).
-- Never store request/response bodies containing secrets here - see
-- UnasApiService::logRequest().
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_logs (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    provider            VARCHAR(30)         NOT NULL COMMENT 'UNAS | META | GOOGLE',
    endpoint             VARCHAR(255)        NOT NULL,
    http_method             VARCHAR(10)          NOT NULL DEFAULT 'GET',
    request_time              DATETIME             NOT NULL,
    http_status                 SMALLINT UNSIGNED   NULL,
    is_success                    TINYINT(1)           NOT NULL DEFAULT 0,
    duration_ms                     INT UNSIGNED         NULL,
    error_message                     TEXT                 NULL,
    created_at                          DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_api_logs_provider (provider),
    KEY idx_api_logs_time (request_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- sync_logs - one row per cron job run, used for both the Sync Logs
-- admin screen and the cron lock mechanism (a RUNNING row with no
-- finished_at younger than a sane timeout means "already in progress").
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_logs (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_name            VARCHAR(60)         NOT NULL COMMENT 'e.g. sync_unas_orders, sync_unas_products, recalculate_profit, daily_summary.',
    status                ENUM('RUNNING','SUCCESS','ERROR') NOT NULL DEFAULT 'RUNNING',
    started_at              DATETIME             NOT NULL,
    finished_at                DATETIME             NULL,
    records_processed            INT UNSIGNED         NOT NULL DEFAULT 0,
    records_failed                  INT UNSIGNED         NOT NULL DEFAULT 0,
    error_message                      TEXT                 NULL,
    created_at                           DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_sync_logs_job (job_name),
    KEY idx_sync_logs_status (job_name, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
