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
- Auth: `POST /login` with `<Params><ApiKey>...</ApiKey></Params>`, response root `<Login>` carries `<Token>`, `<Expire>` (`"Y.m.d H:i:s"`) and `<ExpireTime>` (the same expiry as a UNIX timestamp - authoritative, preferred whenever present); subsequent requests send `Authorization: Bearer {token}`. `UnasApiService::authenticate()`/`parseExpiry()`/`ensureAuthenticated()` implement this, reusing the token until it's close to expiry.
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

- **Shipping** (`<Order><Shipping>`), **Customer** (`<Order><Customer>`, incl. country), **Invoice** (`<Order><Invoice>`): full sub-structure not yet inspected/shared - `orders.customer_email`/`customer_country` are left unpopulated by the sync job (`shipping_fee_charged`/`discount_total` ARE now populated, but from the `<Items>` list, not from `<Shipping>` - see "Order line item financial model" below). Preserved in `raw_payload`.
- **Which `<Param>` entry means "size" vs. other attributes** for products: the live sample confirms a size value (`EU 45`) exists somewhere under `<Params>`, but not which sibling `<Name>`/`<Type>` value identifies it as size specifically - `product_variants.size`/`color` are left unpopulated; the raw block is in `raw_params`.
- **Stock**: no confirmed stock field was seen in the inspected `/getProduct` sample - `product_variants.current_stock_cached` is left `NULL` (migration 003 made it nullable specifically so "unknown" (`NULL`) stays distinguishable from "confirmed zero" (`0`)).
- **`/getOrder`'s exact date-filter format**: `DateStart`/`DateEnd` are sent as `Y-m-d` by `cron/sync_unas_orders.php` - this is the most common convention, not a confirmed one; if wrong it will surface directly in that job's console output / `sync_logs.error_message`.
- **Whether `PriceGross`/`PriceNet` on an `<Item>` are per-unit or a line total** - see "Per-unit vs. line-total pricing" below for how this was resolved without a multi-quantity example to test against.

## Order line item financial model

Confirmed live from production (`storage/logs/unas_sample_orders.xml` after redaction, plus a hand-inspected real order): a normal merchandise row -

```xml
<Item>
    <Id>1420349296</Id>
    <Sku>sneakershieldL</Sku>
    <Name>...</Name>
    <ProductParams>...</ProductParams>
    <Unit>db</Unit>
    <Quantity>1</Quantity>
    <PriceNet>4</PriceNet>
    <PriceGross>4</PriceGross>
    <Vat>0%</Vat>
    <Status></Status>
</Item>
```

- alongside **synthetic financial rows in the same `<Items>` list**, keyed by fixed SKUs, confirmed examples: `shipping-cost` (positive `PriceGross`), `discount-percent` (negative, carries `<Percent>`), `gift` (negative). None of these are sellable products.

### Classification (`UnasOrderItemClassifier`)

Every `<Item>` is classified before persistence into exactly one of: `MERCHANDISE`, `SHIPPING`, `DISCOUNT`, `GIFT`, `UNKNOWN_SYNTHETIC`.

1. **Known map** (extend as new synthetic identifiers are confirmed): `shipping-cost` → SHIPPING, `discount-percent` → DISCOUNT, `gift` → GIFT.
2. Anything else whose `<Sku>` looks like a synthetic "slug" (lowercase letters and hyphens only, no digits - unlike confirmed merchandise SKUs `sneakershieldL`/`CW2288-111`, which have mixed case and/or digits) → `UNKNOWN_SYNTHETIC`, **not** merchandise.
3. Anything else with a negative `<PriceGross>` → `UNKNOWN_SYNTHETIC` too (a real sale is never negatively priced) - a safety net for a future synthetic type that doesn't follow the slug-naming convention.
4. Otherwise → `MERCHANDISE`.

This deliberately errs toward excluding an ambiguous row from `order_items` (where it could pollute revenue/COGS) rather than risking a false merchandise classification - the accepted tradeoff is a false positive on an all-lowercase-letters real SKU (rare), which gets excluded and logged rather than silently mispriced. `UNKNOWN_SYNTHETIC` rows are still fully persisted (to `order_adjustments`, raw payload included) - "unrecognized" never means "discarded".

### Per-unit vs. line-total pricing

Both confirmed examples had `<Quantity>1</Quantity>`, so there was no way to observe from the data alone whether `PriceGross`/`PriceNet` are a **per-unit** price or an already-computed **line total**. This was resolved by taking the reconciliation formula as specified - `SUM(all Item PriceGross * Quantity)` - at face value: that formula is only dimensionally correct if `PriceGross` is per-unit (multiplying an already-summed line total by `Quantity` again would double-count any row with `Quantity > 1`). `order_items.actual_price_per_unit`/`list_price_per_unit` are therefore set directly from `PriceGross` (see "why list = actual" below), and `line_total = PriceGross * Quantity` is computed, not read from the API. **This is inferred, not independently confirmed against a multi-quantity order** - if a real order with `Quantity > 1` fails reconciliation, this is the first thing to re-check.

### Why `list_price_per_unit` equals `actual_price_per_unit` on merchandise rows

No separate "before discount" price field was found on merchandise `<Item>` rows (only `PriceNet`/`PriceGross` - a net/gross pair, not a list/discounted pair). Discounting is represented as a **separate, order-level, negative synthetic row** (`discount-percent`) rather than baked into each merchandise line's price. Consequently:

- `order_items.list_price_per_unit` = `order_items.actual_price_per_unit` = `<PriceGross>` (nothing to subtract - there's only one observed price).
- `order_items.discount_amount` = `0` for every merchandise row.
- **Double-discount guard, satisfied by construction**: `ProfitService` (not yet built) must compute merchandise revenue as `SUM(order_items.actual_price_per_unit * quantity)` and separately subtract `orders.discount_total` (or read `order_adjustments` directly) - never both "a per-item discount" and "the order-level discount row", because the former doesn't exist in this data model.

### How merchandise/shipping/discount/gift combine into `SumPriceGross`

There is exactly one formula, and the categorized columns below are a reporting-friendly decomposition of it, not a second independent truth:

```
SumPriceGross (orders.grand_total)
    ≈ SUM( Item.PriceGross * Item.Quantity )   for EVERY <Item> row - merchandise AND synthetic alike

  = orders.subtotal                              SUM over MERCHANDISE rows only
  + orders.shipping_fee_charged                  SUM over rows classified SHIPPING (normally one "shipping-cost" row)
  - orders.discount_total                        SUM of |PriceGross*Quantity| over rows classified DISCOUNT (stored as a positive magnitude)
  + (gift / unknown_synthetic rows)               NOT folded into a dedicated orders column yet - see order_adjustments
```

`gift` and `UNKNOWN_SYNTHETIC` rows are captured in full in `order_adjustments` (with sign preserved) but are not yet summed into a dedicated `orders` column, since only one real example of each has been seen - inventing a column for "how gifts should net against revenue" before seeing more examples would be exactly the kind of guess this project avoids. They are still fully accounted for in the reconciliation check below, which is what matters for correctness.

### Reconciliation (`OrderReconciler`, `orders.is_reconciled`/`reconciliation_difference`/`reconciled_at`)

For every synced order (with at least one parsed `<Item>`): `difference = SumPriceGross - SUM(all Item PriceGross * Quantity)`. If `|difference| <= 0.02` (currency units), `is_reconciled = 1`; otherwise `is_reconciled = 0` and the order id/key + difference are logged (`Logger::warning` + printed to console) - **never auto-corrected**. `is_reconciled` stays `NULL` for an order with zero parsed items (nothing to check, not a pass). See `cron/sync_unas_orders.php`'s `RECONCILIATION_TOLERANCE` constant to adjust the tolerance.

### Persistence (migration 004)

- `order_items` gained `unas_item_id` + a `(order_id, unas_item_id)` unique key (idempotent re-sync); only `MERCHANDISE`-classified rows are ever written here.
- **New `order_adjustments` table**: one row per non-merchandise `<Item>` (`adjustment_type` = `SHIPPING`/`DISCOUNT`/`GIFT`/`UNKNOWN_SYNTHETIC`), with `price_net`/`price_gross`/`percent` and the full raw payload. Created rather than overloading `order_items` or an existing column specifically so a synthetic row can never accidentally receive FIFO/COGS treatment - see its migration comment and `UnasOrderItemClassifier`'s docblock.
- `orders` gained `is_reconciled`, `reconciliation_difference`, `reconciled_at`.

### `cron/sync_unas_orders.php` / `cron/sync_unas_products.php`

Order sync now imports header + merchandise line items + adjustments + reconciliation in one pass; product sync is unchanged from the previous pass. Both scripts are thin orchestration - the actual field mapping (`UnasOrderMapper`) and reconciliation math (`OrderReconciler`) are separate, dependency-free Services, unit tested in `tests/` without a database or live API call (classifier, mapper, and reconciler: 47 assertions across normal merchandise, shipping-cost, discount-percent, gift, an unrecognized synthetic row, and a full mixed order both reconciling and deliberately mismatched). The full write pipeline (header → items → adjustments → aggregates → reconciliation, including a second run to check idempotency) was additionally verified end-to-end against a local MariaDB instance - a real bug (a SQL prepared statement reusing the same named placeholder twice, which native/non-emulated MySQL prepares reject) was caught and fixed by this testing, underscoring why "verified" here means "actually executed against a database", not just "type-checked". The one thing that could not be tested in this sandbox is the actual live pagination/date-filter behavior against `api.unas.eu` - see "Still NOT confirmed" above.

**`cron/recalculate_profit.php` is still intentionally not built** - per the project owner's explicit instruction, it waits until reconciliation has been proven against real production order data (this pass only proved it against synthetic fixtures shaped like the real examples), not just against a synthetic test suite.
