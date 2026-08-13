<?php

declare(strict_types=1);

namespace App\Models;

use App\Repositories\UserRepository;

/**
 * Thin domain object around a users row. Models in this codebase are
 * intentionally lightweight: data + a few behavior methods, with all SQL
 * delegated to the matching Repository.
 */
final class User
{
    private function __construct(private array $attributes)
    {
    }

    public static function find(int $id): ?self
    {
        $row = (new UserRepository())->findById($id);
        return $row === null ? null : new self($row);
    }

    public static function findByEmail(string $email): ?self
    {
        $row = (new UserRepository())->findByEmail($email);
        return $row === null ? null : new self($row);
    }

    public function id(): int
    {
        return (int) $this->attributes['id'];
    }

    public function name(): string
    {
        return (string) $this->attributes['name'];
    }

    public function email(): string
    {
        return (string) $this->attributes['email'];
    }

    public function role(): string
    {
        return (string) $this->attributes['role'];
    }

    public function passwordHash(): string
    {
        return (string) $this->attributes['password_hash'];
    }

    public function isActive(): bool
    {
        return (bool) $this->attributes['is_active'];
    }

    public function touchLastLogin(): void
    {
        (new UserRepository())->touchLastLogin($this->id());
    }
}
