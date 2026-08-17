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

A live diagnostic (`scripts/test_unas_connection.php`) has since been run successfully on production (HTTP 200 on login/getOrder/getProduct), and its sanitized samples inspected. This section reflects what that confirmed.

### Confirmed protocol (implemented in `UnasApiService`)

- Base URL `https://api.unas.eu/shop`, all functions HTTP POST, XML request/response bodies.
- Auth: `POST /login` with `<Params><ApiKey>...</ApiKey></Params>`, response carries `<Token>` and `<Expire>`; subsequent requests send `Authorization: Bearer {token}`. `UnasApiService::authenticate()`/`ensureAuthenticated()` implement this, reusing the token until it's close to expiry.
- `/getOrder`: documented filter fields `DateStart`, `DateEnd`, `StatusID`, `InvoiceStatus`. Response root is `<Orders><Order>...</Order></Orders>` - confirmed live.
- `/getProduct`: documented filter fields `StatusBase`, `LimitNum`, `LimitStart`, `ContentType` (`getProducts()` defaults this to `full`). Response root is `<Products><Product>...</Product></Products>` - confirmed live.
- `/setOrder`: confirmed to exist, not implemented beyond a thin pass-through - V1 only reads orders.

### Confirmed order/product field mapping (implemented in the repositories/cron jobs below)

**Orders** (`OrderRepository::upsertHeader()`, header only - see "Order line items" below):

| UNAS field | Column | Notes |
|---|---|---|
| `<Id>` | `orders.unas_order_id` | dedupe key (`UNIQUE`) |
| `<Key>` | `orders.unas_order_key` | new column (migration 003); purpose beyond "a second identifier" unconfirmed |
| `<Date>` | `orders.order_date` | |
| `<DateMod>` | `orders.unas_date_mod` | new column; UNAS's own last-modified timestamp, distinct from our `updated_at` |
| `<Currency>` | `orders.currency` | |
| `<Status>` | `orders.status` | human-readable label |
| `<StatusID>` | `orders.status_id` | new column |
| `<StatusType>` | `orders.status_type` | new column; NOT mapped to `is_cancelled` - see ASSUMPTIONS.md |
| `<Payment><Type>` | `orders.payment_method` | |
| `<Payment><Status>` | `orders.payment_status` | new column |
| `<Payment><Paid>` | `orders.payment_amount_paid` | new column |
| `<SumPriceGross>` | `orders.grand_total` | |
| entire `<Order>` | `orders.raw_payload` | full decoded record (including `<Items>`, `<Shipping>`, `<Customer>`, `<Invoice>`) - nothing is lost even though those aren't mapped into typed columns yet |

**Products** (`ProductRepository::upsertProductAndVariant()`):

| UNAS field | Column | Notes |
|---|---|---|
| `<Id>` | `products.unas_product_id` **and** `product_variants.unas_variant_id` | see "Parent/variant grouping" below |
| `<Sku>` | `product_variants.sku` | dedupe key (`UNIQUE`) |
| `<Name>` | `products.name` | |
| `<State>` | `product_variants.unas_state` | new column; raw string, not mapped to `is_active` (unconfirmed values) |
| `<CreateTime>` / `<LastModTime>` | `product_variants.unas_created_at` / `unas_modified_at` | new columns |
| `<Url>` | `product_variants.url` | new column |
| `<Prices><Price type=normal><Gross>` | `product_variants.list_price` | |
| `<Prices><Price type=normal><Actual>` | `product_variants.current_price` | new column; assumed = currently effective selling price, not 100% confirmed - see ASSUMPTIONS.md |
| entire `<Prices>` / `<Params>` / `<Statuses>` | `raw_prices` / `raw_params` / `raw_statuses` (new JSON columns) | nothing lost even though size/color/category aren't extracted into typed columns yet |

**Parent/variant grouping**: this account's `/getProduct` returns one `<Product>` per sellable SKU directly (confirmed live: SKU `FZ4625-100-11` was itself a full top-level `<Product>` with size `EU 45` living under `<Params>`, and an **empty** `<Variants>` node). There is no confirmed field that groups sibling sizes under a real parent, so - per "if no explicit parent identifier exists, do not invent one" - each SKU gets its own 1:1 "shadow" `products` parent row (same UNAS `<Id>` on both). `product_variants` remains the true sellable unit everywhere it matters (order_items, FIFO, profit calc). See `ProductRepository`'s docblock for how to correct this later if a real grouping field turns out to exist for other products in the catalog.

### Still NOT confirmed (deliberately not mapped/guessed anywhere)

- **Order line items** (`<Order><Items><Item>`): confirmed present fields are `<Id>`, `<Sku>`, `<Name>`, `<ProductParams>`. The quantity and per-unit price/discount child element names are **not confirmed** - `order_items.quantity`/`list_price_per_unit`/`actual_price_per_unit` are `NOT NULL` financial columns, so `cron/sync_unas_orders.php` deliberately does **not** insert `order_items` rows yet rather than guess these (see that file's header comment and the double-discount guard in the "Profit formula" section above). The full item data is preserved in `orders.raw_payload` for a later backfill.
- **Shipping** (`<Order><Shipping>`), **Customer** (`<Order><Customer>`, incl. country), **Invoice** (`<Order><Invoice>`): full sub-structure not yet inspected/shared - `orders.shipping_method`/`shipping_fee_charged`/`customer_email`/`customer_country` are left unpopulated by the sync job. Preserved in `raw_payload`.
- **Which `<Param>` entry means "size" vs. other attributes** for products: the live sample confirms a size value (`EU 45`) exists somewhere under `<Params>`, but not which sibling `<Name>`/`<Type>` value identifies it as size specifically - `product_variants.size`/`color` are left unpopulated; the raw block is in `raw_params`.
- **Stock**: no confirmed stock field was seen in the inspected `/getProduct` sample - `product_variants.current_stock_cached` is left `NULL` (migration 003 made it nullable specifically so "unknown" (`NULL`) stays distinguishable from "confirmed zero" (`0`)).
- **`Expire`'s exact format**: `scripts/test_unas_connection.php` now also saves a token-redacted `storage/logs/unas_sample_login.xml` (added this pass, reusing the already-made login call - zero extra API calls) specifically so this can be confirmed on the next diagnostic run.
- **`/getOrder`'s exact date-filter format**: `DateStart`/`DateEnd` are sent as `Y-m-d` by `cron/sync_unas_orders.php` - this is the most common convention, not a confirmed one; if wrong it will surface directly in that job's console output / `sync_logs.error_message`.

### `cron/sync_unas_orders.php` / `cron/sync_unas_products.php`

Implemented this pass - see each file's header comment for full behavior (idempotent upsert, per-record error isolation, pagination, `sync_logs` run tracking + stale-lock detection, `--dry-run`, incremental sync for orders via a `settings` watermark). Both were verified against a local MariaDB instance: mapping functions unit-tested against synthetic data shaped exactly like the real live decode (single-vs-list XML→array quirk, malformed-record handling), repository upserts verified idempotent (re-running never duplicates), and the lock/dry-run/failure-logging paths verified against a real (network-refused) run. The one thing that could not be tested in this sandbox is the actual live pagination/date-filter behavior against `api.unas.eu` - see "Still NOT confirmed" above.

**`cron/recalculate_profit.php` is intentionally not built yet** - it depends on `order_items` being populated, which depends on the item-level field mapping above being confirmed first.
