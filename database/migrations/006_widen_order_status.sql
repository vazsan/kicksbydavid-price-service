-- =====================================================================
-- Widens orders.status from VARCHAR(40) to VARCHAR(255).
--
-- Production sync failure: 8 of 14 orders failed with
-- "SQLSTATE[22001]: Data too long for column 'status'". UNAS's <Status>
-- is a human-readable label, not a short code - confirmed live example:
-- "Elindult a rendelésed a külső raktárunkból!" (44 chars, already over
-- the old 40-char limit; other statuses may be longer still). 255 gives
-- comfortable headroom without a TEXT column, which isn't needed for a
-- single-line label that's also indexed (idx_orders_status).
--
-- Additive/safe: widening a VARCHAR never truncates or invalidates
-- existing data. NOT NULL and DEFAULT 'unknown' are preserved unchanged
-- - only the length changes.
-- =====================================================================

ALTER TABLE orders
    MODIFY COLUMN status VARCHAR(255) NOT NULL DEFAULT 'unknown'
        COMMENT 'Normalized UNAS order status, e.g. pending/confirmed/shipped/cancelled/refunded.';
