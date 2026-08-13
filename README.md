# Profit Analytics

A standalone profit and decision-support system for a UNAS webshop: pulls orders, products/SKUs, purchase costs, ad spend, payment/shipping fees, refunds and returns into one place, and computes real profit, contribution margin, break-even CPA and break-even ROAS - per order, per product, per SKU.

Not a WordPress plugin, not a SaaS demo - a standalone PHP + MySQL web app meant to run on ordinary cPanel hosting and be extended over time (Meta Ads, Google Ads, and eventually an AI analyst layer, per the phased roadmap below).

## Status: V1, first commit

This repository currently contains the **foundation** described in the project brief's "first task": project structure, database schema, admin login, a dashboard skeleton, and a `UnasApiService` skeleton. It does **not** yet import real orders or compute real profit - see [ASSUMPTIONS.md](ASSUMPTIONS.md) "What's deliberately NOT in this first commit" for the exact boundary, and [ARCHITECTURE.md](ARCHITECTURE.md) "Next step" for what's needed to continue.

## Docs

- [SETUP.md](SETUP.md) - how to deploy this to cPanel, from an empty hosting account to a working login.
- [ARCHITECTURE.md](ARCHITECTURE.md) - stack choices and why, directory layout, request lifecycle, currency/FIFO/profit-formula design, what's needed next from the UNAS API.
- [ASSUMPTIONS.md](ASSUMPTIONS.md) - every place a default was chosen instead of asking, and why.

## Stack

PHP 8.1+ (OOP, PDO, no framework) - MySQL/MariaDB (InnoDB, `utf8mb4`, `DECIMAL` money) - plain PHP views + vanilla JS + Chart.js - cPanel Cron Jobs for scheduling. No Composer dependency required to run V1. See ARCHITECTURE.md for the reasoning.

## Roadmap

| Phase | Scope |
|---|---|
| **V1** (this repo, in progress) | structure, schema, admin login, UNAS API client, order/product import, SKU handling, manual COGS, basic profit calc, dashboard |
| V2 | FIFO inventory batches, CSV purchase-cost import, suppliers, inventory source (own/external/Turum) |
| V3 | Shipping costs, payment fees, refunds, returns, full profit calculation |
| V4 | Meta Ads API, campaign/product profitability, break-even ROAS in the UI |
| V5 | Google Ads, automated alerts, SCALE/WATCH/STOP/LOSS automation |
| V6 | AI analyst layer |

## Local development

There's no build step. Point any PHP 8.1+ dev server at `public/` with the front controller as router:

```bash
php -S 127.0.0.1:8000 -t public public/index.php
```

Apply the schema to a local MySQL/MariaDB database (see SETUP.md steps 4-5), copy `.env.example` to `.env` and point it at that database, then create an admin user with `php scripts/create_admin_user.php "..." "..." "..."`.

## Security notes

Passwords are hashed with `password_hash()`/verified with `password_verify()`. All SQL goes through PDO prepared statements (see `app/Repositories/`). All admin forms are CSRF-protected (`app/Core/Csrf.php`). All dynamic output in views is escaped via the `e()` helper. Secrets live only in `.env`, which is git-ignored and deployed outside the webroot; see SETUP.md and the `.htaccess` files under `app/`, `config/`, `database/`, `storage/` for the defense-in-depth around that.
