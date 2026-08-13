<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Tiny PSR-4-style autoloader for the "App\" namespace.
 *
 * We avoid a Composer dependency for this because it is a single mapping
 * (App\ -> /app) and some cPanel accounts don't have Composer/SSH access.
 * If the project later needs third-party packages, introduce Composer then
 * and let composer's autoloader take over (require vendor/autoload.php
 * instead of registering this class).
 */
final class Autoloader
{
    public static function register(string $baseNamespace, string $baseDir): void
    {
        $baseNamespace = trim($baseNamespace, '\\') . '\\';
        $baseDir = rtrim($baseDir, '/') . '/';

        spl_autoload_register(static function (string $class) use ($baseNamespace, $baseDir): void {
            if (!str_starts_with($class, $baseNamespace)) {
                return;
            }

            $relative = substr($class, strlen($baseNamespace));
            $path = $baseDir . str_replace('\\', '/', $relative) . '.php';

            if (is_file($path)) {
                require $path;
            }
        });
    }
}
