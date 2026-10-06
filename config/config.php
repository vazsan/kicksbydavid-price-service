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

    'turum' => [
        'base_url' => rtrim((string) Env::get('TURUM_API_BASE_URL', 'https://api.b2b.turum.pl'), '/'),
        'username' => Env::get('TURUM_USERNAME', ''),
        'password' => Env::get('TURUM_PASSWORD', ''),
        'rate_limit_per_minute' => (int) Env::get('TURUM_RATE_LIMIT_PER_MINUTE', 30),
    ],

    // DPD Polska shipping labels (DPDServices SOAP API). See
    // app/Services/DpdApiService.php for the protocol details and
    // scripts/test_dpd_connection.php for the safe first-run check.
    'dpd' => [
        'env' => strtolower((string) Env::get('DPD_ENV', 'production')),
        'login' => Env::get('DPD_LOGIN', ''),
        'password' => Env::get('DPD_PASSWORD', ''),
        'master_fid' => (string) Env::get('DPD_MASTER_FID', ''),
        'sender_fid' => (string) Env::get('DPD_SENDER_FID', ''),
        'wsdl_url' => Env::get('DPD_WSDL_URL', ''),
        'label_page_format' => strtoupper((string) Env::get('DPD_LABEL_PAGE_FORMAT', 'A4')),
        'default_parcel_weight_kg' => (float) Env::get('DPD_DEFAULT_PARCEL_WEIGHT_KG', 1.0),
        'cod_payment_methods' => (string) Env::get('DPD_COD_PAYMENT_METHODS', ''),
        'cod_currency' => strtoupper((string) Env::get('DPD_COD_CURRENCY', 'PLN')),
        'rate_limit_per_minute' => (int) Env::get('DPD_RATE_LIMIT_PER_MINUTE', 30),
        'sender' => [
            'company' => Env::get('DPD_SENDER_COMPANY', ''),
            'name' => Env::get('DPD_SENDER_NAME', ''),
            'address' => Env::get('DPD_SENDER_ADDRESS', ''),
            'city' => Env::get('DPD_SENDER_CITY', ''),
            'postal_code' => (string) Env::get('DPD_SENDER_POSTAL_CODE', ''),
            'country_code' => strtoupper((string) Env::get('DPD_SENDER_COUNTRY_CODE', 'PL')),
            'phone' => (string) Env::get('DPD_SENDER_PHONE', ''),
            'email' => Env::get('DPD_SENDER_EMAIL', ''),
        ],
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
        'labels_path' => dirname(__DIR__) . '/storage/labels',
    ],
];
