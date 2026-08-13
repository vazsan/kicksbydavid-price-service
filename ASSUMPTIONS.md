# Assumptions

Things that weren't fully specified in the brief, where a safe/simple default was chosen instead of asking. Revisit any of these if they don't match reality.

## Naming / schema deviations from the brief's literal table list

- **`returns` -> `product_returns`.** `RETURNS` is a reserved word in MySQL/MariaDB (used in `CREATE FUNCTION ... RETURNS` syntax); an unquoted table named `returns` fails to create. Verified empirically against MariaDB 10.11 during this build. All FK/index names follow the new table name.
- **Two extra tables beyond the brief's minimum list**: `other_costs` (backs the "Other Variable Costs" line in the profit formula - the brief's formula needs it but the minimum table list didn't include it) and `exchange_rates` (optional reference table to source per-transaction FX rates consistently; not required for reporting since every transactional row already stores its own `exchange_rate_to_base`).
- **Shipping**: the brief's example (customer paid 3.90 EUR, carrier actually cost 5.20 EUR) is modeled as `orders.shipping_fee_charged` + `orders.actual_shipping_cost`, with a separate `shipping_costs` table holding *configurable rate rules* per method (used to estimate `actual_shipping_cost` when no real carrier invoice amount is known) - rather than a dedicated per-order shipping-cost table, since the brief's own table list only mentions `shipping_costs` (singular, rate-table shaped).
- **Cancellations**: modeled as `orders.is_cancelled` + `orders.status`, not a separate table. A paid-then-cancelled order additionally gets a `FULL` row in `refunds` so the money reversal stays auditable, per the brief's requirement that a cancelled order must not show as normal revenue.

## Technical defaults

- **Base currency**: EUR (`APP_BASE_CURRENCY` in `.env`), matching "Első verzióban EUR legyen a base currency."
- **PHP baseline**: 8.1+ syntax (readonly properties, enums-as-DB-ENUM not PHP enums, constructor promotion, `match`). Verified against PHP 8.4 in this session; cPanel accounts commonly offer 8.1-8.3 via MultiPHP Manager, so nothing 8.4-specific was used intentionally.
- **No Composer / no third-party PHP packages** in V1 - see ARCHITECTURE.md "Why no framework, why no Composer". Chart.js is loaded from a CDN in the browser, not a PHP dependency.
- **Session-only admin auth**, one role distinction (`admin` / `viewer` in `users.role`, `viewer` unused until a read-only screen is needed). No "forgot password" flow in V1 - the first admin account is created via `scripts/create_admin_user.php` from the command line.
- **Router**: exact-path + `:param` matching via `?route=` (set by `public/.htaccess`'s rewrite rule), not PATH_INFO-based - works identically whether the vhost docroot is `public/` directly or the app sits in a subdirectory.
- **Logging**: flat files under `storage/logs/{channel}-{date}.log`, not a database table (except `api_logs`/`sync_logs`, which the brief explicitly asked to be queryable from the admin UI).
- **Money formatting** in the UI uses `.` as the decimal separator and a space as the thousands separator (locale-neutral default) rather than assuming HU or SK formatting conventions - revisit once real users are testing the dashboard.

## UNAS API specifics

- The **exact endpoint names, request/response field names, and auth flow details** in `app/Services/UnasApiService.php` are best-effort placeholders based on UNAS's publicly documented API shape (XML, two-step token auth), **not yet validated against a live account** - no API key or account access was available in this session. See ARCHITECTURE.md "Next step" for exactly what's needed to finish this.
- Assumed UNAS enforces a **requests-per-minute** rate limit (common for e-commerce platform APIs); `UNAS_RATE_LIMIT_PER_MINUTE` defaults to 60 in `.env.example` as a conservative placeholder pending the real documented limit.

## Product status rules

- The brief's example thresholds (SCALE: margin > 20% and ROAS > 1.2x break-even; WATCH: margin 10-20%; STOP: ROAS < break-even; LOSS: negative contribution profit) were seeded verbatim into the `settings` table as the V1 defaults. The status **engine** itself (`ProductStatusService`) is not yet built - only its configuration storage - since it depends on ad spend data (Meta/Google, V4/V5) that V1 doesn't have yet.

## What's deliberately NOT in this first commit

Per "31. Első feladatod", this pass is scoped to: structure, schema, `.env.example`, config, PDO connection, admin login, dashboard skeleton, `UnasApiService` skeleton. It deliberately does **not** yet include: order/product import logic, FIFO consumption logic, `ProfitService`, CSV import, the Orders/Products/Inventory/Settings/Sync Logs/API Logs admin screens (nav links exist in the layout but are not yet routed - clicking them 404s), or any cron job body beyond what's documented as the next step. See the final summary message for the proposed next step.
