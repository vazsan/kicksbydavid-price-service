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

## Next step: what we need from the UNAS API

The schema and `UnasApiService` skeleton are built against the UNAS API's documented shape (XML request/response, two-step token auth), but the exact endpoint paths and field names in this codebase are **placeholders pending validation against a live UNAS account** (see the TODOs in `app/Services/UnasApiService.php`). To build the real order/product import (the next development step), we need:

1. **UNAS API key** for the shop (Webshop admin > Settings > API key), placed in `.env` as `UNAS_API_KEY`.
2. Access to (or a copy of) the **UNAS API reference** for the account's API version, specifically:
   - The exact `/login` request/response field names (what we call `Token`/`Expire` are best guesses).
   - The order-list and order-detail endpoint names, their filter parameters (date range, status, pagination), and a **sample response** for one real order - so `sku`, `actual selling price`, `discount`, `shipping fee`, `payment method` etc. can be mapped precisely instead of guessed.
   - The product/SKU endpoint's response shape, in particular **how variant SKUs (sizes) are nested under a parent product** in your account (the brief's example: `DD1391-100-42`, `DD1391-100-425`, `DD1391-100-43`).
   - Whatever status values UNAS uses for order status (so they can be mapped to `orders.status`) and whether cancellations/refunds are separate order states or a separate endpoint.
3. Confirmation of the **actual UNAS API rate limit** (requests/minute) so `UNAS_RATE_LIMIT_PER_MINUTE` is set correctly rather than guessed.

Once that's available, the next build step is: implement the real XML field mapping in `UnasApiService`, then `cron/sync_unas_orders.php` and `cron/sync_unas_products.php` (order/product import with de-dupe on `unas_order_id`, SKU upsert into `product_variants`).
