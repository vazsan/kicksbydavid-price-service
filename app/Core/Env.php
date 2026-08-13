<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Minimal .env file loader.
 *
 * We intentionally avoid pulling in a Composer dependency (e.g. vlucas/phpdotenv)
 * for this: cPanel shared hosting does not always have Composer available,
 * and parsing "KEY=VALUE" lines is a handful of lines of code. If the project
 * ever needs a fuller .env spec (multiline values, variable interpolation),
 * swap this out for phpdotenv behind the same load() signature.
 */
final class Env
{
    private static bool $loaded = false;

    /**
     * Load a .env file into getenv()/$_ENV/$_SERVER.
     * Existing environment variables (e.g. set by the webserver/cPanel
     * "Environment Variables" UI) always win over the file, so ops can
     * override without editing the file.
     */
    public static function load(string $path): void
    {
        if (self::$loaded) {
            return;
        }

        if (!is_file($path) || !is_readable($path)) {
            throw new \RuntimeException(
                "Environment file not found or not readable: {$path}. " .
                "Copy .env.example to .env and fill in real values."
            );
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            throw new \RuntimeException("Unable to read environment file: {$path}");
        }

        foreach ($lines as $line) {
            $line = trim($line);

            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            if (!str_contains($line, '=')) {
                continue;
            }

            [$name, $value] = explode('=', $line, 2);
            $name = trim($name);
            $value = self::stripQuotes(trim($value));

            if ($name === '') {
                continue;
            }

            // Don't let the .env file override a real environment variable.
            if (getenv($name) !== false) {
                continue;
            }

            putenv("{$name}={$value}");
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }

        self::$loaded = true;
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $value = getenv($key);

        if ($value === false) {
            return $default;
        }

        return match (strtolower($value)) {
            'true', '(true)' => true,
            'false', '(false)' => false,
            'null', '(null)' => null,
            'empty', '(empty)' => '',
            default => $value,
        };
    }

    private static function stripQuotes(string $value): string
    {
        if (strlen($value) >= 2) {
            $first = $value[0];
            $last = $value[-1];
            if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                return substr($value, 1, -1);
            }
        }

        return $value;
    }
}
