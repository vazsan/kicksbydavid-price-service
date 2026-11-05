<?php

declare(strict_types=1);

/**
 * CLI-only gzip'd mysqldump of selected tables into storage/backups/
 * (outside the webroot, behind storage/.htaccess). The DB password is
 * handed to mysqldump via a temporary 0600 defaults file that is deleted
 * right after, so it never appears in the process list or in logs.
 *
 * Usage: php scripts/db_backup.php <label> [table ...]   (no tables = whole DB)
 * Keeps the newest 6 backups, deletes older ones (disk quota is tight).
 */

require __DIR__ . '/../app/Core/Autoloader.php';

use App\Core\App;

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('This script can only be run from the command line.');
}

\App\Core\Autoloader::register('App', __DIR__ . '/../app');
App::bootstrap(dirname(__DIR__));

$label = preg_replace('/[^a-z0-9_-]/i', '', $argv[1] ?? 'manual') ?: 'manual';
$tables = array_values(array_filter(array_slice($argv, 2), static fn ($t) => preg_match('/^[a-z0-9_]+$/', $t) === 1));
$db = App::config('database');
$dir = dirname(__DIR__) . '/storage/backups';
if (!is_dir($dir) && !mkdir($dir, 0750, true)) {
    fwrite(STDERR, "cannot create $dir\n");
    exit(1);
}

$cnf = tempnam(sys_get_temp_dir(), 'pa_my');
chmod($cnf, 0600);
file_put_contents($cnf, "[client]\nuser=\"" . addslashes((string) $db['username']) . "\"\npassword=\"" . addslashes((string) $db['password']) . "\"\nhost=\"" . addslashes((string) $db['host']) . "\"\n");

$file = $dir . '/' . date('Ymd-His') . '-' . $label . '.sql.gz';
$cmd = 'mysqldump --defaults-extra-file=' . escapeshellarg($cnf)
    . ' --single-transaction --no-tablespaces --skip-lock-tables '
    . escapeshellarg((string) $db['database'])
    . ($tables === [] ? '' : ' ' . implode(' ', array_map('escapeshellarg', $tables)))
    . ' | gzip -6 > ' . escapeshellarg($file) . '; echo ${PIPESTATUS[0]}';
$status = trim((string) shell_exec('bash -c ' . escapeshellarg($cmd)));
unlink($cnf);

clearstatcache();
$size = is_file($file) ? filesize($file) : 0;
fwrite(STDOUT, "backup $file size=$size mysqldump_exit=$status\n");

$all = glob($dir . '/*.sql.gz') ?: [];
rsort($all);
foreach (array_slice($all, 6) as $old) {
    unlink($old);
    fwrite(STDOUT, "rotated out $old\n");
}
exit($status === '0' && $size > 100 ? 0 : 1);
