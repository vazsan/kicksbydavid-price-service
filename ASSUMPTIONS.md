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

- Login (`/login`, `<Params><ApiKey>`, response `Token`/`Expire`, `Authorization: Bearer {token}`), `/getOrder`'s `DateStart`/`DateEnd`/`StatusID`/`InvoiceStatus` filters, and `/getProduct`'s `StatusBase`/`LimitNum`/`LimitStart`/`ContentType` filters are implemented as given/confirmed - either supplied directly by the project owner or corroborated by (summarized, not literal) search results against `unas.hu`'s own documentation pages.
- Everything else about the response shape (order line items, customer fields, product/SKU/variant nesting, discount/refund representation) is **deliberately not implemented or guessed** - see ARCHITECTURE.md "UNAS API integration status". This session's sandbox has no network egress to `unas.hu` or `api.unas.eu` (both return a 403 from the org's egress proxy - confirmed with a direct `curl` test, not just a `WebFetch` limitation), so no live response was available to read the real field names off. `scripts/test_unas_connection.php` exists specifically to produce that ground truth from an environment that *does* have access (production).
- `Expire` in the login response is assumed to be an absolute UNIX timestamp (per one search-result summary describing it that way), not a relative seconds-until-expiry duration - `UnasApiService::parseExpiry()` handles both looks (numeric -> absolute timestamp) but this needs confirming against `scripts/test_unas_connection.php`'s printed "Token expires at" line on a real run.
- `/getOrder`'s single-order filter field is assumed to be `OrderID` (UNAS's PascalCase convention) - unconfirmed, only used by the unexercised `getOrderDetails()` convenience method.
- `/getOrder`'s pagination is assumed to reuse `/getProduct`'s `LimitNum`/`LimitStart` convention - unconfirmed; `scripts/test_unas_connection.php` passes them and will surface a UNAS-side error if that's wrong.
- Removed the earlier skeleton's invented `getSkuPrice()`/`getSkuStock()` methods and the `/getStock` endpoint/`setOrderStatus` name they used - a search-result summary of the real docs describes price/stock as components of the full `/getProduct` record (`ContentType=full`), not separate calls, and the real write-back endpoint is `/setOrder`, not `/setOrderStatus`.
- UNAS enforces a **requests-per-minute** rate limit (common for e-commerce platform APIs, and explicitly called out by the project owner: "UNAS rate-limits failed requests"); `UNAS_RATE_LIMIT_PER_MINUTE` defaults to 60 in `.env.example` as a conservative placeholder pending the real documented limit - not yet confirmed either.
- `scripts/test_unas_connection.php`'s PII redaction is tag-name-keyword-based (`Name`/`Email`/`Phone`/`Address`/... anywhere in a tag name) plus an email-regex safety net, **not** an exact allow-list - because the real customer-data tag names are exactly what that script is meant to discover. Tighten it to an exact allow-list once a real sample confirms the field names.

## Product status rules

- The brief's example thresholds (SCALE: margin > 20% and ROAS > 1.2x break-even; WATCH: margin 10-20%; STOP: ROAS < break-even; LOSS: negative contribution profit) were seeded verbatim into the `settings` table as the V1 defaults. The status **engine** itself (`ProductStatusService`) is not yet built - only its configuration storage - since it depends on ad spend data (Meta/Google, V4/V5) that V1 doesn't have yet.

## What's deliberately NOT in this codebase yet

Per "31. Első feladatod", the first pass was scoped to: structure, schema, `.env.example`, config, PDO connection, admin login, dashboard skeleton, `UnasApiService` skeleton. This pass (UNAS diagnostic) corrected that skeleton's protocol details and added `scripts/test_unas_connection.php`, but deliberately still does **not** include: order/product response field mapping, `cron/sync_unas_orders.php`, `cron/sync_unas_products.php`, FIFO consumption logic, `ProfitService`, `cron/recalculate_profit.php`, CSV import, or the Orders/Products/Inventory/Settings/Sync Logs/API Logs admin screens (nav links exist in the layout but are not yet routed - clicking them 404s). All of that depends on first inspecting a real `/getOrder`/`/getProduct` response, which requires running `scripts/test_unas_connection.php` somewhere with network access to `api.unas.eu` (production) - see the final summary message of this session for exact run instructions and next steps.
