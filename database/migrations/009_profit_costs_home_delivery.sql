-- =====================================================================
-- Migration 009: separate SK home-delivery parcel price.
--
-- Live orders (2026-10/11) show two SK DPD methods: "DPD csomagpontok"
-- (pickup points - priced by the owner's DPD Pickup Export card) and
-- "DPD HÁZHOZSZÁLLITÁS" (home delivery). The DPD Classic Export price list
-- for home delivery is NOT among the provided PDFs, so the Pickup price is
-- seeded here as a provisional value and labelled as such on the
-- dashboard. Clear it (empty) to make home delivery show as missing, or
-- replace it with the real Classic price.
-- =====================================================================
INSERT IGNORE INTO settings (setting_group, setting_key, setting_value, description, updated_at) VALUES
('profit_costs', 'shipping.sk.home_parcel_eur', '2.98', 'SK DPD home delivery per parcel (EUR). PROVISIONAL: Pickup Export 1-3 kg price; the Classic Export price list was not provided.', NOW()),
('profit_costs', 'shipping.hu.home_parcel_eur', '', 'HU Packeta home delivery per parcel (EUR) - NOT PROVIDED yet.', NOW());
