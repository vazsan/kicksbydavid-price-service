<?php

declare(strict_types=1);

use App\Core\Env;

/**
 * Central application configuration.
 *
 * Every value here is derived from environment variables (see .env.example)
 * so no secret ever lives in a versioned file. This file is included by
 * app/Core/App.php during bootstrap and returns a plain associative array;
 * keep it framework-free on purpose.
 */

Env::load(dirname(__DIR__) . '/.env');

return [
    'app' => [
        'name' => Env::get('APP_NAME', 'Profit Analytics'),
        'env' => Env::get('APP_ENV', 'production'),
        'debug' => (bool) Env::get('APP_DEBUG', false),
        'url' => rtrim((string) Env::get('APP_URL', ''), '/'),
        'timezone' => Env::get('APP_TIMEZONE', 'Europe/Budapest'),
        'base_currency' => strtoupper((string) Env::get('APP_BASE_CURRENCY', 'EUR')),
        'key' => Env::get('APP_KEY', ''),
    ],

    'database' => [
        'host' => Env::get('DB_HOST', '127.0.0.1'),
        'port' => (int) Env::get('DB_PORT', 3306),
        'database' => Env::get('DB_DATABASE', ''),
        'username' => Env::get('DB_USERNAME', ''),
        'password' => Env::get('DB_PASSWORD', ''),
        'charset' => Env::get('DB_CHARSET', 'utf8mb4'),
    ],

    'session' => [
        'name' => Env::get('SESSION_NAME', 'profit_analytics_session'),
        'lifetime_minutes' => (int) Env::get('SESSION_LIFETIME_MINUTES', 120),
        'secure_cookie' => (bool) Env::get('SESSION_SECURE_COOKIE', true),
    ],

    'unas' => [
        'api_key' => Env::get('UNAS_API_KEY', ''),
        'base_url' => rtrim((string) Env::get('UNAS_API_BASE_URL', 'https://api.unas.eu/shop'), '/'),
        'rate_limit_per_minute' => (int) Env::get('UNAS_RATE_LIMIT_PER_MINUTE', 60),
    ],

    'meta' => [
        'app_id' => Env::get('META_APP_ID', ''),
        'app_secret' => Env::get('META_APP_SECRET', ''),
        'access_token' => Env::get('META_ACCESS_TOKEN', ''),
        'ad_account_id' => Env::get('META_AD_ACCOUNT_ID', ''),
    ],

    'google_ads' => [
        'developer_token' => Env::get('GOOGLE_ADS_DEVELOPER_TOKEN', ''),
        'client_id' => Env::get('GOOGLE_ADS_CLIENT_ID', ''),
        'client_secret' => Env::get('GOOGLE_ADS_CLIENT_SECRET', ''),
        'refresh_token' => Env::get('GOOGLE_ADS_REFRESH_TOKEN', ''),
        'customer_id' => Env::get('GOOGLE_ADS_CUSTOMER_ID', ''),
    ],

    'logging' => [
        'level' => Env::get('LOG_LEVEL', 'info'),
        'path' => dirname(__DIR__) . '/storage/logs',
    ],

    'storage' => [
        'cache_path' => dirname(__DIR__) . '/storage/cache',
    ],
];
