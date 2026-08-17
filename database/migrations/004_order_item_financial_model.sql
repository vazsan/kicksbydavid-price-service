-- =====================================================================
-- Order item financial model - confirmed from real live UNAS <Order>
-- <Items><Item> rows on production (see ARCHITECTURE.md "Order line item
-- financial model").
--
-- UNAS mixes real merchandise lines with synthetic financial rows in the
-- same <Items> list (shipping-cost, discount-percent, gift, and
-- potentially others not yet seen). This migration:
--   1. Makes order_items safe to re-sync without duplicating rows
--      (adds unas_item_id + a unique key), now that real item import is
--      implemented.
--   2. Adds order_adjustments, a new table for the synthetic rows -
--      created rather than overloading order_items or an existing
--      column, because a synthetic row is not a sellable SKU and must
--      never receive COGS (see UnasOrderItemClassifier's docblock).
--   3. Adds reconciliation tracking columns on `orders` so
--      SUM(all Item PriceGross * Quantity) can be checked against
--      SumPriceGross per order without silently inventing a correction
--      when it doesn't match.
-- =====================================================================

-- ---------------------------------------------------------------------
-- order_items: dedupe key so re-running cron/sync_unas_orders.php never
-- creates duplicate line items for the same order.
-- ---------------------------------------------------------------------
ALTER TABLE order_items
    ADD COLUMN unas_item_id VARCHAR(64) NULL
        COMMENT 'UNAS <Item><Id> - confirmed present on merchandise rows; used as the dedupe key together with order_id.'
        AFTER order_id,
    ADD UNIQUE KEY uq_order_items_order_unas_item (order_id, unas_item_id);

-- ---------------------------------------------------------------------
-- order_adjustments: every non-merchandise <Item> row (shipping, discount,
-- gift, and anything classified UNKNOWN_SYNTHETIC), kept as its own typed
-- + raw record. Deliberately separate from order_items: these rows are
-- never sellable SKUs and must never flow into FIFO/COGS.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_adjustments (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id            BIGINT UNSIGNED     NOT NULL,
    unas_item_id        VARCHAR(64)         NULL COMMENT 'UNAS <Item><Id>, e.g. "shipping-cost".',
    sku                 VARCHAR(64)         NOT NULL COMMENT 'UNAS <Item><Sku> - the classification key (see UnasOrderItemClassifier).',
    adjustment_type     ENUM('SHIPPING','DISCOUNT','GIFT','UNKNOWN_SYNTHETIC') NOT NULL,
    quantity            INT UNSIGNED        NOT NULL DEFAULT 1,
    price_net           DECIMAL(14,4)       NULL COMMENT 'UNAS <Item><PriceNet>, per unit (see ARCHITECTURE.md for the per-unit-vs-line-total reasoning).',
    price_gross         DECIMAL(14,4)       NULL COMMENT 'UNAS <Item><PriceGross>, per unit. Negative for discount/gift rows.',
    percent             DECIMAL(6,3)        NULL COMMENT 'UNAS <Item><Percent>, present on percentage-based discount rows.',
    currency            CHAR(3)             NOT NULL DEFAULT 'EUR',
    raw_payload         JSON                NULL COMMENT 'Full raw UNAS <Item> for this row, kept for audit/debugging.',
    created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_order_adjustments_order_unas_item (order_id, unas_item_id),
    KEY idx_order_adjustments_order (order_id),
    KEY idx_order_adjustments_type (adjustment_type),
    CONSTRAINT fk_order_adjustments_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- orders: reconciliation tracking. NULL = not yet checked (e.g. rows
-- synced before this migration, or an order whose Items couldn't be
-- parsed at all); 1 = SUM(Item PriceGross * Quantity) matched
-- SumPriceGross within tolerance; 0 = it didn't, and
-- reconciliation_difference records by how much - investigate, don't
-- silently trust either number in that case.
-- ---------------------------------------------------------------------
ALTER TABLE orders
    ADD COLUMN is_reconciled TINYINT(1) NULL
        COMMENT 'NULL = not checked yet; 1 = SUM(Item PriceGross*Quantity) matched SumPriceGross within tolerance; 0 = mismatch, see reconciliation_difference.'
        AFTER raw_payload,
    ADD COLUMN reconciliation_difference DECIMAL(14,4) NULL
        COMMENT 'SumPriceGross - SUM(all Item PriceGross * Quantity). Zero/near-zero when is_reconciled = 1.'
        AFTER is_reconciled,
    ADD COLUMN reconciled_at DATETIME NULL
        COMMENT 'When the reconciliation check above was last run for this order.'
        AFTER reconciliation_difference;
