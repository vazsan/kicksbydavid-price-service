# Architecture

## Stack

- **PHP 8.1+**, object-oriented, no framework. `declare(strict_types=1)` everywhere.
- **PDO** for all database access, prepared statements only, `ERRMODE_EXCEPTION`.
- **MySQL 8 / MariaDB 10.4+**, InnoDB, `utf8mb4`. All money is `DECIMAL`, never `FLOAT`/`DOUBLE`.
- **Plain PHP views** (no template engine) + **vanilla JS** + **Chart.js** (loaded from CDN) for the admin panel.
- **cPanel-compatible**: no Composer dependency is required to run the app (see "Why no framework / no Composer" below), no long-running processes other than what cPanel Cron Jobs can trigger.

## Why no framework, why no Composer

The brief explicitly asks to justify pulling in a framework before doing so. For V1:

- **Routing** is 15 lines of exact-match + `:param` matching (`app/Core/Router.php`) - a full router (Symfony Routing, etc.) buys nothing at this scale and adds a Composer dependency cPanel accounts don't always support well.
- **.env loading** is ~40 lines (`app/Core/Env.php`) - avoids `vlucas/phpdotenv` for the same reason.
- **Autoloading** is a single-namespace PSR-4-style `spl_autoload_register` (`app/Core/Autoloader.php`) instead of Composer's generated autoloader.

If a real need shows up later (e.g. the Meta/Google Ads SDKs, which realistically require their vendor HTTP clients), Composer will be introduced **then**, scoped to that need, with `vendor/` added via `composer install` on deploy - not preemptively.

## Directory structure

```
/app
  /Controllers   - one class per admin screen, thin: auth check -> call Service/Repository -> render View
  /Models        - lightweight domain objects (data + behavior), no SQL
  /Services      - business logic that doesn't belong to one table (UnasApiService, later ProfitService)
  /Repositories  - all SQL lives here, one class per table/aggregate, prepared statements only
  /Helpers       - small stateless utilities (DateRange, RateLimiter)
  /Core          - framework-less bootstrap: App, Router, Auth, Csrf, Database, Env, Logger, View, Autoloader
/config
  config.php     - single source of truth, built from .env at request time
/database
  /migrations    - plain numbered .sql files, applied in order (see SETUP.md - no migration runner in V1)
/public           <- **this is the webroot**
  index.php       - front controller
  /assets/css, /assets/js
/cron              - cron/*.php entry points, one per scheduled job
/storage
  /logs            - app/php/auth/unas_api/... log files, one file per channel per day
  /cache           - rate limiter state, future response caches
/views
  /layouts, /auth, /dashboard, /errors, ...
/scripts           - one-off CLI utilities (e.g. create_admin_user.php)
```

`App\` maps to `/app` (see `app/Core/Autoloader.php`). Everything outside `/public` is unreachable from the browser both structurally (outside the docroot) and defensively (a `Require all denied` `.htaccess` sits in `app/`, `config/`, `database/`, `storage/`, `views/`, `cron/`, `scripts/`, and the repo root, in case a webroot is ever misconfigured to point above `public/`).

## Request lifecycle

1. Apache rewrites every request that isn't an existing static file to `public/index.php?route=<path>` (`public/.htaccess`).
2. `public/index.php` boots the autoloader, loads config/env, starts the session, registers routes, and dispatches.
3. A Controller method runs: checks `Auth::requireLogin()` where needed, asks a Repository/Service for data, and calls `View::render()` / `View::renderWithLayout()`.
4. Views are plain PHP; `e()`, `money()`, `percent()`, `old()` helpers (`app/Core/helpers.php`) keep output escaped and consistently formatted.

The same `App::bootstrap()` call is shared by the web front controller and every `cron/*.php` script, so both entry points get identical config/logging/DB setup.

## Currency handling

- `APP_BASE_CURRENCY` (default `EUR`) is the currency all aggregated/cross-order reporting is expressed in.
- Every money-bearing table stores its own `currency` and, where a rollup could cross currencies, its own `exchange_rate_to_base` **at the time of the transaction** - so a historical number is always reproducible even if today's FX rate is different. See `orders`, `inventory_batches`, `purchase_costs`, `refunds`.
- An optional `exchange_rates` reference table exists to source those per-row rates consistently during import; it is not required for reporting to work (each row is self-contained).

## FIFO inventory costing

- `inventory_batches`: one row per purchase lot (`quantity_purchased`, `quantity_remaining`, `unit_cost`, `purchase_date`).
- `inventory_movements`: append-only audit trail of every quantity change against a batch (`SALE`, `RETURN_RESTOCK`, `ADJUSTMENT`, `MANUAL`), each carrying a `unit_cost_snapshot` copied from the batch at that moment.
- COGS for a given `order_item` is always reproducible as `SUM(unit_cost_snapshot * -quantity)` over its `SALE` movements - never a single stored number that can drift from the underlying batches.
- `purchase_costs` is the append-only ledger of *how a batch was created* (manual entry vs CSV import vs, later, a supplier API), kept separate from `inventory_batches` so the original submission record survives even if the batch itself is later adjusted.

This is designed but not yet wired into the order-import pipeline - see "Next steps" below (FIFO consumption logic is V2 per the phased roadmap in the brief).

## Profit formula (to be implemented in `ProfitService`, V1 later step)

```
Net Revenue
  - COGS                     (FIFO, see above)
  - Advertising Cost         (allocated; V4+)
  - Payment Fee              (from payment_fees rate table)
  - Shipping Cost            (actual_shipping_cost, or estimated from shipping_costs rate table)
  - COD Fee                  (modeled as a payment_fees row for the "cod" method)
  - Discount Cost             *** see note below ***
  - Refund Cost               (refunds.amount)
  - Return Cost                (product_returns.return_cost)
  - Other Variable Costs       (other_costs)
= Contribution Profit
```

**Double-discount guard**: `order_items.actual_price_per_unit` is defined as the price **after** discount - it is what the customer was actually charged. `discount_amount` is stored for reporting only. `ProfitService` must compute revenue from `actual_price_per_unit * quantity` and must never additionally subtract `discount_amount` from that - the schema and the field naming/comments in `001_create_schema.sql` exist specifically to make that bug hard to write by accident. This will get an explicit unit test when `ProfitService` is built.

## Product status rules (SCALE / WATCH / STOP / LOSS)

Thresholds live in the `settings` table (`setting_group = 'status_rules'`), seeded with the brief's example values in `database/migrations/002_seed_settings.sql`, and are meant to be edited from Admin > Settings - never hardcoded in PHP once the status engine (`ProductStatusService`, later step) is built.

## Multi-tenant/multi-market note

The shop sells into Hungary and Slovakia; `orders.currency` and `orders.customer_country` carry that per-order, and reporting rolls up into the single base currency. No separate "market" concept was introduced in V1 - not needed until region-specific P&L views are requested.

## UNAS API integration status

### Confirmed protocol (implemented in `UnasApiService`)

- Base URL `https://api.unas.eu/shop`, all functions HTTP POST, XML request/response bodies.
- Auth: `POST /login` with `<Params><ApiKey>...</ApiKey></Params>`, response carries `<Token>` and `<Expire>`; subsequent requests send `Authorization: Bearer {token}`. `UnasApiService::authenticate()`/`ensureAuthenticated()` implement this, reusing the token until it's close to expiry.
- `/getOrder`: documented filter fields `DateStart`, `DateEnd`, `StatusID` (a status serial number, or one of the status *types* `open_normal` | `open_prepare` | `close_ok` | `close_fault`), `InvoiceStatus` (pipe-separated status names). Unfiltered/unlimited requests cap at 500 orders per UNAS's own default.
- `/getProduct`: documented filter fields `StatusBase`, `LimitNum`, `LimitStart` (pagination), `ContentType` (`getProducts()` defaults this to `full` so price/stock/parameters come back in one call).
- `/setOrder`: confirmed to exist (writes back in the same shape `/getOrder` returns), not implemented beyond a thin pass-through - V1 only reads orders.

### NOT yet confirmed - this environment cannot reach UNAS's docs or API

Both `https://unas.hu` (the documentation site) and `https://api.unas.eu` (the live API) are blocked by this sandbox's network egress policy (`curl` to either returns a 403 from the proxy, and `WebFetch`/`WebSearch` cannot retrieve the docs pages directly - only AI-summarized search snippets of them were available, which is not a reliable source for exact XML tag names). Concretely, still unknown and **not guessed anywhere in this codebase**:

- The exact response XML structure for `/getOrder` and `/getProduct` - line items, customer fields, discount/refund representation, parent-product/variant-SKU nesting.
- Whether `/getOrder`'s pagination fields are really `LimitNum`/`LimitStart` (confirmed only for `/getProduct`; assumed shared by `getOrders()` but flagged as unconfirmed in its docblock).
- The exact `/getOrder` single-order filter field name (`getOrderDetails()` assumes `OrderID`, unconfirmed).
- Whether `Expire` in the login response is an absolute UNIX timestamp or a relative seconds-until-expiry duration (`UnasApiService::parseExpiry()` currently assumes absolute, per the one search snippet that described it that way - confirm against a real login response).

### How to unblock this: `scripts/test_unas_connection.php`

Rather than guess any of the above, this script (added in this pass) does a minimal, safe, read-only live call - login + a 3-record `/getOrder` sample + a 3-record `/getProduct` sample - and saves the raw (PII-redacted) XML to `storage/logs/unas_sample_orders.xml` / `unas_sample_products.xml`. It must be run somewhere with real network access to `api.unas.eu` and the real `UNAS_API_KEY` - i.e. on the production server, not in this development sandbox. See the final summary of this session for exact run instructions.

**Next step once those files exist**: read the exact tag names off them, update the docblocks/TODOs in `UnasApiService` and the field-mapping notes below, then implement `cron/sync_unas_orders.php` and `cron/sync_unas_products.php` (order/product import with de-dupe on `unas_order_id`, SKU upsert into `product_variants`), and only after that `cron/recalculate_profit.php`. Each of those depends on the previous one being correct against real data - do not build them ahead of having the sample XML, per the same "don't guess" principle.
