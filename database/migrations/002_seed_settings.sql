-- =====================================================================
-- Default settings seed data.
--
-- These are the configurable knobs referenced throughout the codebase
-- (ProductStatusService thresholds, base currency, etc). All of them can
-- be edited later from Admin > Settings; nothing here is meant to be
-- hardcoded in PHP.
-- =====================================================================

INSERT INTO settings (setting_group, setting_key, setting_value, description) VALUES
    ('general', 'base_currency', 'EUR', 'Base currency used for all cross-currency aggregated reporting.'),

    -- Product status rules (section 12 of the spec). Values are plain
    -- numbers; the *_percent ones are stored as whole percentages (20 = 20%).
    ('status_rules', 'scale_min_contribution_margin_percent', '20', 'SCALE: contribution margin must be above this %.'),
    ('status_rules', 'scale_min_roas_multiple_of_breakeven', '1.2', 'SCALE: ROAS must be at least this multiple of break-even ROAS.'),
    ('status_rules', 'watch_min_contribution_margin_percent', '10', 'WATCH: contribution margin lower bound %.'),
    ('status_rules', 'watch_max_contribution_margin_percent', '20', 'WATCH: contribution margin upper bound %.'),
    ('status_rules', 'stop_roas_below_breakeven', '1', 'STOP: ROAS below break-even ROAS (1 = enabled).'),
    ('status_rules', 'loss_negative_contribution_profit', '1', 'LOSS: contribution profit is negative (1 = enabled).'),
    ('status_rules', 'critical_return_rate_percent', '15', 'Return rate % above which a product cannot be SCALE regardless of margin.'),

    ('payment_fees', 'default_fee_type', 'PERCENTAGE', 'Fallback fee_type when a payment method has no configured rate.'),
    ('shipping', 'default_cost_type', 'FIXED', 'Fallback cost_type when a shipping method has no configured rate.')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
