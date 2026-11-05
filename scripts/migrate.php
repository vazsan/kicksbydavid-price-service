<?php

declare(strict_types=1);

/**
 * CLI-only migration runner. Applies ONE named file from
 * database/migrations/ and records it in `schema_migrations`, refusing to
 * apply the same file twice. Migrations 001-007 predate this runner (they
 * were applied by hand); use --baseline to record them without running.
 *
 * Statements are split on a semicolon at the end of a line, so keep one
 * statement terminator per line end in migration files (they already are).
 * MySQL DDL auto-commits: a failure mid-file leaves the earlier statements
 * applied - the runner prints which statement failed so it can be fixed
 * by hand. Take a backup first (scripts/db_backup.php).
 *
 * Usage:
 *   php scripts/migrate.php --baseline 001 002 003 004 005 006 007
 *   php scripts/migrate.php 008_shop_fx_utm_turum_profit.sql
 *   php scripts/migrate.php --status
 */

require __DIR__ . '/../app/Core/Autoloader.php';

use App\Core\App;
use App\Core\Database;

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('This script can only be run from the command line.');
}

\App\Core\Autoloader::register('App', __DIR__ . '/../app');
App::bootstrap(dirname(__DIR__));
$db = Database::connection();
$dir = dirname(__DIR__) . '/database/migrations';

$db->exec('CREATE TABLE IF NOT EXISTS schema_migrations (
    filename VARCHAR(190) NOT NULL PRIMARY KEY,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    mode VARCHAR(10) NOT NULL DEFAULT \'run\'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');

$applied = array_column($db->query('SELECT filename FROM schema_migrations')->fetchAll(), 'filename');
$args = array_slice($argv, 1);

if ($args === [] || $args[0] === '--status') {
    foreach (glob($dir . '/*.sql') ?: [] as $f) {
        fwrite(STDOUT, (in_array(basename($f), $applied, true) ? '[x] ' : '[ ] ') . basename($f) . PHP_EOL);
    }
    exit(0);
}

if ($args[0] === '--baseline') {
    foreach (array_slice($args, 1) as $prefix) {
        foreach (glob($dir . '/' . basename($prefix) . '*.sql') ?: [] as $f) {
            $db->prepare('INSERT IGNORE INTO schema_migrations (filename, mode) VALUES (?, \'baseline\')')->execute([basename($f)]);
            fwrite(STDOUT, 'baseline ' . basename($f) . PHP_EOL);
        }
    }
    exit(0);
}

$file = $dir . '/' . basename($args[0]);
if (!is_file($file)) {
    fwrite(STDERR, 'No such migration: ' . basename($args[0]) . PHP_EOL);
    exit(1);
}
if (in_array(basename($file), $applied, true)) {
    fwrite(STDOUT, 'Already applied: ' . basename($file) . PHP_EOL);
    exit(0);
}

// Drop full-line comments, then split on ";" at end of line.
$sql = implode("\n", array_filter(
    explode("\n", (string) file_get_contents($file)),
    static fn (string $l) => !str_starts_with(ltrim($l), '--')
));
$statements = array_values(array_filter(array_map('trim', preg_split('/;\s*$/m', $sql) ?: []), static fn ($s) => $s !== ''));

foreach ($statements as $i => $statement) {
    try {
        $db->exec($statement);
        fwrite(STDOUT, sprintf('ok %d/%d: %s', $i + 1, count($statements), substr(preg_replace('/\s+/', ' ', $statement), 0, 90)) . PHP_EOL);
    } catch (\Throwable $e) {
        fwrite(STDOUT, sprintf('FAILED %d/%d: %s', $i + 1, count($statements), $e->getMessage()) . PHP_EOL);
        exit(1);
    }
}

$db->prepare('INSERT INTO schema_migrations (filename) VALUES (?)')->execute([basename($file)]);
fwrite(STDOUT, 'Applied ' . basename($file) . PHP_EOL);
