<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Synchronizer-token CSRF protection.
 *
 * One token per session (regenerated at login), compared with a
 * constant-time function. Every state-changing form must include
 * Csrf::field() and every POST controller must call Csrf::verify()
 * before touching the database.
 */
final class Csrf
{
    private const SESSION_KEY = '_csrf_token';

    public static function token(): string
    {
        if (empty($_SESSION[self::SESSION_KEY])) {
            $_SESSION[self::SESSION_KEY] = bin2hex(random_bytes(32));
        }

        return $_SESSION[self::SESSION_KEY];
    }

    public static function field(): string
    {
        return '<input type="hidden" name="_csrf" value="' . htmlspecialchars(self::token(), ENT_QUOTES) . '">';
    }

    public static function verify(?string $submittedToken): bool
    {
        if (!is_string($submittedToken) || empty($_SESSION[self::SESSION_KEY])) {
            return false;
        }

        return hash_equals($_SESSION[self::SESSION_KEY], $submittedToken);
    }

    public static function regenerate(): void
    {
        $_SESSION[self::SESSION_KEY] = bin2hex(random_bytes(32));
    }
}
