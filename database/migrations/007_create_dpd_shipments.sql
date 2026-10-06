-- ---------------------------------------------------------------------
-- Migration 007: dpd_shipments
--
-- One row per DPD Polska shipment generated for a UNAS order. Exists for
-- two reasons:
--   1. Idempotency - generating a label twice for the same order would
--      register a second, duplicate waybill in DPD's system (and cost a
--      second pickup). generate_dpd_label.php checks this table first and
--      refuses to re-generate unless --force is passed.
--   2. Audit - which order shipped under which waybill, when, and where
--      the saved PDF lives on disk.
--
-- The receiver address is intentionally NOT stored here: it is customer
-- PII and already lives (raw) in orders.raw_payload. This table keeps
-- only shipping metadata.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dpd_shipments (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    unas_order_id       VARCHAR(64)         NOT NULL
        COMMENT 'UNAS <Order><Id>. Not a FK to orders.id on purpose - a label can be generated for an order fetched live from UNAS even if the analytics import has not stored it locally yet.',
    order_id            BIGINT UNSIGNED     NULL
        COMMENT 'Local orders.id if the order is already imported; NULL if the label was generated straight from a live UNAS fetch.',
    session_id          VARCHAR(64)         NULL
        COMMENT 'DPD session id returned by generatePackagesNumbers, used to pull the label.',
    waybills            VARCHAR(512)        NOT NULL DEFAULT ''
        COMMENT 'Comma-separated DPD waybill (parcel) numbers for this shipment.',
    sender_fid          VARCHAR(32)         NULL,
    parcel_count        INT UNSIGNED        NOT NULL DEFAULT 1,
    label_page_format   VARCHAR(20)         NOT NULL DEFAULT 'A4',
    label_path          VARCHAR(255)        NULL
        COMMENT 'Path to the saved label PDF under storage/labels, relative to the project root.',
    status              VARCHAR(20)         NOT NULL DEFAULT 'created'
        COMMENT 'created | failed - high-level local status of the generation attempt.',
    error_message       TEXT                NULL,
    created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_dpd_shipments_order (unas_order_id),
    KEY idx_dpd_shipments_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
