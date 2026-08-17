<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;

/**
 * Read/write access to the `settings` key-value table. Used by the sync
 * jobs to persist an incremental-sync watermark (e.g. "orders synced up
 * to this UNAS DateMod/DateEnd"), and available for the future Settings
 * admin screen and status-rule thresholds already seeded there.
 */
final class SettingsRepository
{
    public function get(string $key, ?string $default = null): ?string
    {
        $stmt = Database::connection()->prepare(
            'SELECT setting_value FROM settings WHERE setting_key = :key LIMIT 1'
        );
        $stmt->execute(['key' => $key]);
        $value = $stmt->fetchColumn();

        return $value === false ? $default : (string) $value;
    }

    public function set(string $key, string $value, string $group = 'general', ?string $description = null): void
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO settings (setting_group, setting_key, setting_value, description, updated_at)
             VALUES (:group, :key, :value, :description, NOW())
             ON DUPLICATE KEY UPDATE
                setting_value = VALUES(setting_value),
                updated_at = NOW()'
        );
        $stmt->execute([
            'group' => $group,
            'key' => $key,
            'value' => $value,
            'description' => $description,
        ]);
    }
}
