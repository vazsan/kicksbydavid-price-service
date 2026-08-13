<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Shared bootstrap used by both the web front controller (public/index.php)
 * and every CLI cron script (cron/*.php). Keeping this in one place means
 * both entry points get identical config loading, error handling, timezone,
 * logging and DB setup - no drift between "how the website runs" and "how
 * the cron job runs".
 */
final class App
{
    /** @var array<string, mixed> */
    private static array $config = [];

    public static function bootstrap(string $basePath): array
    {
        require_once __DIR__ . '/helpers.php';

        self::$config = require $basePath . '/config/config.php';

        date_default_timezone_set(self::$config['app']['timezone']);

        Logger::init(self::$config['logging']['path'], self::$config['logging']['level']);

        // Never show raw PHP errors to end users; always log them.
        ini_set('display_errors', self::$config['app']['debug'] ? '1' : '0');
        error_reporting(E_ALL);
        set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
            Logger::error('php', $message, ['file' => $file, 'line' => $line, 'severity' => $severity]);
            return false; // Let PHP's normal handling continue too.
        });
        set_exception_handler(static function (\Throwable $e): void {
            Logger::error('php', $e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            if (php_sapi_name() !== 'cli') {
                http_response_code(500);
                echo self::$config['app']['debug']
                    ? '<pre>' . htmlspecialchars((string) $e, ENT_QUOTES) . '</pre>'
                    : 'Something went wrong. Please try again later.';
            }
        });

        Database::init(self::$config['database']);

        return self::$config;
    }

    public static function config(?string $key = null, mixed $default = null): mixed
    {
        if ($key === null) {
            return self::$config;
        }

        $segments = explode('.', $key);
        $value = self::$config;

        foreach ($segments as $segment) {
            if (!is_array($value) || !array_key_exists($segment, $value)) {
                return $default;
            }
            $value = $value[$segment];
        }

        return $value;
    }
}
