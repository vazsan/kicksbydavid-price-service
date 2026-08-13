<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;

/**
 * PDO connection wrapper.
 *
 * A single shared PDO instance per request (classic singleton), always
 * configured for prepared statements with real placeholders and exceptions
 * on error, so every Repository can rely on the same safe defaults instead
 * of repeating connection setup.
 */
final class Database
{
    private static ?PDO $connection = null;

    /** @var array<string, mixed> */
    private static array $config = [];

    public static function init(array $config): void
    {
        self::$config = $config;
    }

    public static function connection(): PDO
    {
        if (self::$connection === null) {
            self::$connection = self::connect();
        }

        return self::$connection;
    }

    private static function connect(): PDO
    {
        $config = self::$config;

        if ($config === []) {
            throw new \RuntimeException('Database::init() must be called before Database::connection().');
        }

        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $config['host'],
            $config['port'],
            $config['database'],
            $config['charset'] ?? 'utf8mb4'
        );

        try {
            return new PDO($dsn, $config['username'], $config['password'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES '" . ($config['charset'] ?? 'utf8mb4') . "'",
            ]);
        } catch (PDOException $e) {
            // Never leak DSN/credentials in the exception surfaced to the client.
            Logger::error('database', 'Database connection failed', ['message' => $e->getMessage()]);
            throw new \RuntimeException('Database connection failed. Check storage/logs for details.', 0, $e);
        }
    }

    /**
     * Mainly useful for long-running CLI/cron scripts that want a fresh
     * connection after an idle period.
     */
    public static function reset(): void
    {
        self::$connection = null;
    }
}
