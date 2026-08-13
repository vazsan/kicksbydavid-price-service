<?php

declare(strict_types=1);

/**
 * Front controller. This is the ONLY PHP file meant to be reached
 * directly by the webserver - everything else (app/, config/, database/,
 * storage/, views/) lives outside public/ or is denied via .htaccess.
 *
 * See public/.htaccess: every request is rewritten to this file with the
 * original path passed as ?route=..., so routing works identically
 * whether the vhost docroot is public/ directly or this app sits in a
 * subdirectory.
 *
 * NOTE: intentionally does not `use App\Core\App;` - a "use"-imported
 * alias named "App" would shadow the top-level "App\" namespace for
 * every other unqualified "App\..." reference below (PHP resolves the
 * first segment of a qualified name against import aliases), silently
 * breaking e.g. App\Controllers\DashboardController::class. Fully
 * qualifying \App\Core\App below avoids that trap.
 */

require dirname(__DIR__) . '/app/Core/Autoloader.php';

use App\Core\Auth;
use App\Core\Router;

\App\Core\Autoloader::register('App', dirname(__DIR__) . '/app');

$config = \App\Core\App::bootstrap(dirname(__DIR__));

Auth::start($config['session']);

$router = new Router();

$router->get('/', [App\Controllers\DashboardController::class, 'index']);
$router->get('/login', [App\Controllers\AuthController::class, 'showLogin']);
$router->post('/login', [App\Controllers\AuthController::class, 'login']);
$router->post('/logout', [App\Controllers\AuthController::class, 'logout']);
$router->get('/dashboard', [App\Controllers\DashboardController::class, 'index']);

$route = $_GET['route'] ?? '/';
$router->dispatch($_SERVER['REQUEST_METHOD'], '/' . ltrim((string) $route, '/'));
