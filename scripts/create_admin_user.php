<?php

declare(strict_types=1);

/**
 * CLI helper to create the first admin user.
 *
 * Run once after applying the database migrations:
 *   php scripts/create_admin_user.php "Full Name" "email@example.com" "a-strong-password"
 *
 * Deliberately not exposed through the web UI in V1 - the admin panel has
 * no self-registration screen, so the very first account has to be
 * created from the command line (SSH/cPanel Terminal) or phpMyAdmin.
 * Passwords are hashed with password_hash() before being stored - never
 * pass an already-hashed value here.
 */

require __DIR__ . '/../app/Core/Autoloader.php';

use App\Core\App;
use App\Core\Database;
use App\Repositories\UserRepository;

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('This script can only be run from the command line.');
}

[$scriptName, $name, $email, $password] = array_pad($argv, 4, null);

if ($name === null || $email === null || $password === null) {
    fwrite(STDERR, "Usage: php scripts/create_admin_user.php \"Full Name\" \"email@example.com\" \"password\"\n");
    exit(1);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Error: '{$email}' is not a valid email address.\n");
    exit(1);
}

if (strlen($password) < 10) {
    fwrite(STDERR, "Error: password must be at least 10 characters.\n");
    exit(1);
}

\App\Core\Autoloader::register('App', __DIR__ . '/../app');
$config = App::bootstrap(dirname(__DIR__));

$repository = new UserRepository();

if ($repository->findByEmail($email) !== null) {
    fwrite(STDERR, "Error: a user with email '{$email}' already exists.\n");
    exit(1);
}

$id = $repository->create($name, $email, password_hash($password, PASSWORD_DEFAULT), 'admin');

echo "Admin user created (id={$id}, email={$email}).\n";
