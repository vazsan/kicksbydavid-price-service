-- =====================================================================
-- Adds HANDLING to order_adjustments.adjustment_type.
--
-- Confirmed live on a production dry-run: SKU "handel-cost" (UNAS's own
-- spelling) is a positive per-order handling/processing charge, distinct
-- from shipping-cost - previously fell through to UNKNOWN_SYNTHETIC.
-- Also confirmed: "discount-amount" is a fixed-amount discount sibling
-- to "discount-percent" - classified DISCOUNT, no schema change needed
-- for that one.
--
-- Additive/safe: widening an ENUM to add a new allowed value never
-- invalidates existing rows (their current values - SHIPPING, DISCOUNT,
-- GIFT, UNKNOWN_SYNTHETIC - all remain valid options).
-- =====================================================================

ALTER TABLE order_adjustments
    MODIFY COLUMN adjustment_type ENUM('SHIPPING','DISCOUNT','GIFT','HANDLING','UNKNOWN_SYNTHETIC') NOT NULL;
