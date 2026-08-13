<?php

declare(strict_types=1);

/**
 * Global helper functions available inside plain-PHP views.
 * Deliberately NOT namespaced: views are included as top-level scripts
 * (no "namespace App\..." declaration), so a namespaced function would
 * require an explicit `use function` in every single view file.
 */

if (!function_exists('e')) {
    /**
     * HTML-escape a value for safe output. Use on every piece of
     * user-/API-supplied data printed into a view: <?= e($value) ?>
     */
    function e(mixed $value): string
    {
        return htmlspecialchars((string) ($value ?? ''), ENT_QUOTES, 'UTF-8');
    }
}

if (!function_exists('money')) {
    /**
     * Format a DECIMAL amount for display. Kept separate from currency
     * conversion logic - this only controls presentation (2 decimals,
     * thousands separator, currency suffix).
     */
    function money(string|float|int|null $amount, string $currency = 'EUR'): string
    {
        $value = (float) ($amount ?? 0);
        return number_format($value, 2, '.', ' ') . ' ' . $currency;
    }
}

if (!function_exists('percent')) {
    function percent(string|float|int|null $value, int $decimals = 1): string
    {
        return number_format((float) ($value ?? 0), $decimals, '.', ' ') . '%';
    }
}

if (!function_exists('old')) {
    /**
     * Re-populate a form field with the previously submitted value after
     * a validation error redirect (stored in the session by the controller).
     */
    function old(string $key, string $default = ''): string
    {
        return e($_SESSION['_old'][$key] ?? $default);
    }
}
