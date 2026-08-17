-- =====================================================================
-- Additive columns for fields confirmed against a real, live UNAS
-- /login, /getOrder and /getProduct response (see
-- storage/logs/unas_sample_{login,orders,products}.xml on production,
-- and ARCHITECTURE.md "UNAS API integration status").
--
-- Every column here is nullable and additive - safe to run against a
-- database that already has orders/products/product_variants rows (this
-- migration predates any real sync job actually writing to those
-- tables, so in practice they're still empty, but the columns are
-- designed to not require a backfill either way).
--
-- What's deliberately NOT added here: any column for order line item
-- quantity/price/discount, order shipping cost/method, or customer
-- country. Those need the exact child tag names inside a live
-- <Order><Items><Item> and <Order><Shipping>/<Customer>, which are not
-- yet confirmed - see ASSUMPTIONS.md. Existing columns
-- (order_items.quantity/list_price_per_unit/actual_price_per_unit,
-- orders.shipping_method/shipping_fee_charged/customer_country) are left
-- as-is and simply not populated by cron/sync_unas_orders.php yet.
-- =====================================================================

-- ---------------------------------------------------------------------
-- orders: header-level fields confirmed from a live <Order> response
-- that don't already have a matching column.
-- ---------------------------------------------------------------------
ALTER TABLE orders
    ADD COLUMN unas_order_key VARCHAR(64) NULL
        COMMENT 'UNAS <Order><Key> - a second UNAS-side identifier distinct from <Id>/unas_order_id; exact purpose/stability not yet documented, preserved for reference.'
        AFTER unas_order_id,
    ADD COLUMN status_id VARCHAR(30) NULL
        COMMENT 'UNAS <Order><StatusID> verbatim. `status` holds the human-readable <Status> label.'
        AFTER status,
    ADD COLUMN status_type VARCHAR(30) NULL
        COMMENT 'UNAS <Order><StatusType>, e.g. open_normal/open_prepare/close_ok/close_fault per UNAS docs. Not yet mapped to is_cancelled - see ASSUMPTIONS.md.'
        AFTER status_id,
    ADD COLUMN payment_status VARCHAR(30) NULL
        COMMENT 'UNAS <Order><Payment><Status>.'
        AFTER payment_method,
    ADD COLUMN payment_amount_paid DECIMAL(14,4) NULL
        COMMENT 'UNAS <Order><Payment><Paid> - amount actually paid so far, as reported by UNAS. Not necessarily equal to grand_total (partial/COD payments).'
        AFTER payment_status,
    ADD COLUMN unas_date_mod DATETIME NULL
        COMMENT 'UNAS <Order><DateMod> - when UNAS itself last modified the order; distinct from our own updated_at bookkeeping column. Useful for spotting status changes on re-sync.'
        AFTER order_date;

-- ---------------------------------------------------------------------
-- order_items: audit/backfill safety net, mirroring orders.raw_payload.
-- Populated once item-level sync is implemented; until then this column
-- simply isn't written to (no order_items rows are inserted yet at all -
-- see cron/sync_unas_orders.php).
-- ---------------------------------------------------------------------
ALTER TABLE order_items
    ADD COLUMN raw_payload JSON NULL
        COMMENT 'Full raw UNAS <Item> for this line, kept for audit/debugging and to backfill fields once their mapping is confirmed.'
        AFTER currency;

-- ---------------------------------------------------------------------
-- product_variants: SKU-level fields confirmed from a live <Product>
-- response. Per ARCHITECTURE.md, this UNAS account's /getProduct
-- returns one <Product> per sellable SKU directly (the observed sample
-- had an empty <Variants> node with the size living under <Params>
-- instead) - these columns therefore live on product_variants, the
-- confirmed sellable unit, not on the (currently 1:1 shadow) parent
-- products row.
-- ---------------------------------------------------------------------
ALTER TABLE product_variants
    ADD COLUMN unas_state VARCHAR(30) NULL
        COMMENT 'UNAS <Product><State> verbatim - not yet mapped to is_active, meaning unconfirmed.'
        AFTER inventory_source,
    ADD COLUMN unas_created_at DATETIME NULL
        COMMENT 'UNAS <Product><CreateTime>.'
        AFTER unas_state,
    ADD COLUMN unas_modified_at DATETIME NULL
        COMMENT 'UNAS <Product><LastModTime>.'
        AFTER unas_created_at,
    ADD COLUMN url VARCHAR(500) NULL
        COMMENT 'UNAS <Product><Url> - product detail page URL.'
        AFTER unas_modified_at,
    ADD COLUMN current_price DECIMAL(14,4) NULL
        COMMENT 'UNAS <Product><Prices><Price type=normal><Actual> - assumed to be the currently effective gross selling price (may differ from list_price/<Gross> if a sale is active). Interpretation not 100% confirmed - see ASSUMPTIONS.md.'
        AFTER list_price,
    ADD COLUMN raw_prices JSON NULL
        COMMENT 'Full raw UNAS <Prices> block (all <Price> rows, not just type=normal, plus <Vat>) - nothing is assumed lost even though only list_price/current_price are extracted into typed columns.'
        AFTER current_price,
    ADD COLUMN raw_params JSON NULL
        COMMENT 'Full raw UNAS <Params> block (all <Param> id/type/name/value rows). Size (e.g. "EU 45") is confirmed to live somewhere in here, but which Param entry is "the size one" is not yet confirmed - see ASSUMPTIONS.md. The dedicated `size`/`color` columns are left unpopulated until that''s known, to avoid mapping the wrong Param into them.'
        AFTER raw_prices,
    ADD COLUMN raw_statuses JSON NULL
        COMMENT 'Full raw UNAS <Statuses> block - not yet mapped to a specific "base status" column since the exact sub-field UNAS uses for that is unconfirmed.'
        AFTER raw_params,
    MODIFY COLUMN current_stock_cached INT NULL DEFAULT NULL
        COMMENT 'Last known stock as reported by UNAS; informational only, not used by FIFO/profit calc. Nullable (was NOT NULL DEFAULT 0) so "we do not know yet" (NULL) is distinguishable from "confirmed zero stock" (0) - no stock field has been confirmed in a live /getProduct response yet.';
