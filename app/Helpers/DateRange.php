<?php

declare(strict_types=1);

namespace App\Helpers;

/**
 * Resolves the dashboard's date-range filter (?range=...&from=...&to=...)
 * into a concrete [from, to] pair of Y-m-d dates (inclusive).
 */
final class DateRange
{
    public const PRESETS = ['today', 'yesterday', '7d', '30d', 'this_month', 'prev_month', 'custom'];

    public readonly string $preset;
    public readonly string $from;
    public readonly string $to;

    private function __construct(string $preset, string $from, string $to)
    {
        $this->preset = $preset;
        $this->from = $from;
        $this->to = $to;
    }

    public static function fromRequest(array $query): self
    {
        $preset = in_array($query['range'] ?? '', self::PRESETS, true) ? $query['range'] : '7d';
        $today = new \DateTimeImmutable('today');

        return match ($preset) {
            'today' => new self($preset, $today->format('Y-m-d'), $today->format('Y-m-d')),
            'yesterday' => (function () use ($preset, $today) {
                $d = $today->modify('-1 day')->format('Y-m-d');
                return new self($preset, $d, $d);
            })(),
            '30d' => new self($preset, $today->modify('-29 days')->format('Y-m-d'), $today->format('Y-m-d')),
            'this_month' => new self($preset, $today->modify('first day of this month')->format('Y-m-d'), $today->format('Y-m-d')),
            'prev_month' => new self(
                $preset,
                $today->modify('first day of last month')->format('Y-m-d'),
                $today->modify('last day of last month')->format('Y-m-d')
            ),
            'custom' => self::customOrFallback($query, $today),
            default => new self($preset, $today->modify('-6 days')->format('Y-m-d'), $today->format('Y-m-d')),
        };
    }

    private static function customOrFallback(array $query, \DateTimeImmutable $today): self
    {
        $from = self::validDate($query['from'] ?? null);
        $to = self::validDate($query['to'] ?? null);

        if ($from === null || $to === null || $from > $to) {
            return new self('7d', $today->modify('-6 days')->format('Y-m-d'), $today->format('Y-m-d'));
        }

        return new self('custom', $from, $to);
    }

    private static function validDate(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $date = \DateTimeImmutable::createFromFormat('Y-m-d', $value);
        return ($date && $date->format('Y-m-d') === $value) ? $value : null;
    }
}
