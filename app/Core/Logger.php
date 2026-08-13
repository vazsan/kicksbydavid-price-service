<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Minimal file logger writing to storage/logs/{channel}-{Y-m-d}.log.
 *
 * Deliberately not PSR-3: this app has no other logging need than
 * "append a line, keep app/http/cron/api errors in separate files, don't
 * ever crash the request because logging failed".
 */
final class Logger
{
    private static string $path = __DIR__ . '/../../storage/logs';

    private const LEVELS = ['debug' => 0, 'info' => 1, 'warning' => 2, 'error' => 3];

    private static string $minLevel = 'info';

    public static function init(string $path, string $minLevel = 'info'): void
    {
        self::$path = rtrim($path, '/');
        self::$minLevel = $minLevel;
    }

    public static function debug(string $channel, string $message, array $context = []): void
    {
        self::write('debug', $channel, $message, $context);
    }

    public static function info(string $channel, string $message, array $context = []): void
    {
        self::write('info', $channel, $message, $context);
    }

    public static function warning(string $channel, string $message, array $context = []): void
    {
        self::write('warning', $channel, $message, $context);
    }

    public static function error(string $channel, string $message, array $context = []): void
    {
        self::write('error', $channel, $message, $context);
    }

    private static function write(string $level, string $channel, string $message, array $context): void
    {
        if ((self::LEVELS[$level] ?? 0) < (self::LEVELS[self::$minLevel] ?? 0)) {
            return;
        }

        $line = sprintf(
            '[%s] %s.%s: %s %s%s',
            date('Y-m-d H:i:s'),
            $channel,
            strtoupper($level),
            $message,
            $context === [] ? '' : json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            PHP_EOL
        );

        $file = self::$path . '/' . $channel . '-' . date('Y-m-d') . '.log';

        // Logging must never break the request/cron job it's called from.
        try {
            if (!is_dir(self::$path)) {
                @mkdir(self::$path, 0750, true);
            }
            @file_put_contents($file, $line, FILE_APPEND | LOCK_EX);
        } catch (\Throwable) {
            // Swallow - logging is best-effort.
        }
    }
}
