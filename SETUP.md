# Setup (cPanel deployment)

## 1. Requirements

- PHP 8.1+ with `pdo_mysql`, `curl`, `simplexml`, `json` extensions (all standard on cPanel's MultiPHP).
- MySQL or MariaDB database.
- Shell/SSH or cPanel Terminal access to run `scripts/create_admin_user.php` once (a "Terminal" app is available on most modern cPanel accounts; if not, see the phpMyAdmin fallback in step 5).

## 2. Get the code onto the server

Either `git clone` the repository directly on the server (if SSH access + git are available), or upload a zip of the repository via cPanel File Manager and extract it. Either way, put it **outside** `public_html`, e.g.:

```
/home/<cpanel-user>/profit-analytics/        <- repo root (app/, config/, database/, public/, ...)
```

## 3. Point the domain/subdomain at `public/`

The webroot must be this project's `public/` folder, **not** the repo root - `config/`, `.env`, `app/`, `database/` must never be reachable by URL.

- **Preferred**: create a subdomain (e.g. `app.yourshop.com`) and, in cPanel's "Domains" screen, set its **Document Root** to `/home/<cpanel-user>/profit-analytics/public`.
- **If your plan only allows `public_html` as the docroot** (no custom document root option): copy the *contents* of `public/` into `public_html/`, and edit the two `require`/`require_once` paths at the top of `public_html/index.php` to point at the real project root (e.g. `/home/<cpanel-user>/profit-analytics/app/...` instead of `dirname(__DIR__)`). This is a fallback, not the default - prefer a custom document root if at all possible, since it needs no path surgery and keeps `public/index.php` identical to what's in version control.

Either way, `app/`, `config/`, `database/`, `storage/`, `views/`, `cron/`, and `scripts/` each ship with a `Require all denied` `.htaccess` as a second line of defense.

## 4. Create the database

In cPanel > MySQL Databases:
1. Create a database (e.g. `cpuser_profit`).
2. Create a database user with a strong password.
3. Add the user to the database with **All Privileges**.

## 5. Apply the schema

Via SSH/Terminal:

```bash
mysql -u <db_user> -p <db_name> < database/migrations/001_create_schema.sql
mysql -u <db_user> -p <db_name> < database/migrations/002_seed_settings.sql
```

No SSH access? Open **phpMyAdmin** from cPanel, select the database, use the **Import** tab, and import `001_create_schema.sql` then `002_seed_settings.sql`, in that order (the second depends on tables created by the first).

Future schema changes will ship as additional numbered files in `database/migrations/` (e.g. `003_....sql`) - there is no migration-runner tool in V1, apply them in order the same way.

## 6. Configure `.env`

Copy `.env.example` to `.env` **in the repo root** (next to `app/`, one level above `public/` - so it is never inside the webroot):

```bash
cp .env.example .env
```

Edit `.env` and fill in at minimum:
- `APP_URL` - the real URL the app will be served at.
- `APP_KEY` - generate with `php -r "echo bin2hex(random_bytes(32));"`.
- `DB_HOST` (usually `localhost` on cPanel), `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` from step 4.
- `SESSION_SECURE_COOKIE=true` (keep true - the site should only ever be served over HTTPS).
- `UNAS_API_KEY` once available (see ARCHITECTURE.md "Next step" for what's still needed here).

Leave the Meta/Google Ads keys blank - those are read but unused until the corresponding later phase is built.

## 7. Create the first admin user

```bash
php scripts/create_admin_user.php "Your Name" "you@example.com" "a-strong-password"
```

There is no self-registration screen by design (admin panel, single shop). No SSH access at all? Temporarily add a one-off `scripts/create_admin_user.php`-equivalent call from phpMyAdmin isn't safe (password would need to be hashed manually) - if this is your situation, ask for a small one-time web-based setup script rather than hand-writing a password hash into SQL.

## 8. Verify

Visit the site URL - you should land on `/login`. Sign in with the account from step 7; you should reach `/dashboard` showing all-zero KPIs (expected - no orders have been imported yet) and an "No aggregated data yet" notice.

## 9. Cron Jobs

Not yet applicable in this first commit - `cron/` currently has no job scripts (the UNAS sync jobs are the next build step; see ARCHITECTURE.md). Once they exist, wire them up in cPanel > Cron Jobs pointing at e.g.:

```
/usr/local/bin/php /home/<cpanel-user>/profit-analytics/cron/sync_unas_orders.php >> /dev/null 2>&1
```

(Use the full path to the PHP CLI binary your cPanel account provides - check with `which php` over SSH, or MultiPHP INI Editor's "PHP CLI" note if unsure. Redirect output to `/dev/null` since the scripts will do their own logging to `storage/logs/` and `sync_logs`.)

## Troubleshooting

- **500 error, blank page**: set `APP_DEBUG=true` temporarily in `.env` to see the real error, or check `storage/logs/php-*.log`. Set it back to `false` afterward.
- **"Database connection failed"**: check `DB_HOST`/`DB_DATABASE`/`DB_USERNAME`/`DB_PASSWORD` in `.env`; check `storage/logs/database-*.log` for the underlying PDO error (never shown to the browser on purpose).
- **CSS/JS not loading**: confirm the docroot really is `public/` (or that the `public_html` fallback in step 3 was done correctly) - `assets/` must be reachable at `/assets/...` directly.
- **`.env` not found**: it must live in the repo root (one level above `public/`), not inside `public/`, and not be named `.env.example`.
