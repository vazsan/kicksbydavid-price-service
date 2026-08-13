<?php

declare(strict_types=1);

namespace App\Core;

use App\Models\User;

/**
 * Session-backed authentication.
 *
 * Passwords are verified with password_verify() against a password_hash()
 * digest (bcrypt/argon2i, whatever the running PHP's default is at hashing
 * time - never a custom scheme). Session ID is regenerated on login to
 * prevent session fixation.
 */
final class Auth
{
    private const SESSION_KEY = 'auth_user_id';

    public static function start(array $sessionConfig): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        session_name($sessionConfig['name']);
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => $sessionConfig['secure_cookie'],
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();

        self::enforceIdleTimeout((int) $sessionConfig['lifetime_minutes']);
    }

    private static function enforceIdleTimeout(int $minutes): void
    {
        $now = time();
        $last = $_SESSION['_last_activity'] ?? $now;

        if (($now - $last) > ($minutes * 60)) {
            self::logout();
        }

        $_SESSION['_last_activity'] = $now;
    }

    public static function attempt(string $email, string $password): bool
    {
        $user = User::findByEmail($email);

        if ($user === null || !$user->isActive() || !password_verify($password, $user->passwordHash())) {
            Logger::warning('auth', 'Failed login attempt', ['email' => $email]);
            return false;
        }

        session_regenerate_id(true);
        $_SESSION[self::SESSION_KEY] = $user->id();
        Csrf::regenerate();
        $user->touchLastLogin();

        Logger::info('auth', 'Successful login', ['user_id' => $user->id()]);

        return true;
    }

    public static function check(): bool
    {
        return isset($_SESSION[self::SESSION_KEY]);
    }

    public static function id(): ?int
    {
        return $_SESSION[self::SESSION_KEY] ?? null;
    }

    public static function user(): ?User
    {
        $id = self::id();
        return $id === null ? null : User::find($id);
    }

    public static function logout(): void
    {
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }

        session_destroy();
    }

    /**
     * Call at the top of any controller action that requires a logged-in
     * admin. Redirects to /login otherwise.
     */
    public static function requireLogin(): void
    {
        if (!self::check()) {
            header('Location: /login');
            exit;
        }
    }
}
