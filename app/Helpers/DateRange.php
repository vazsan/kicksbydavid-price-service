<?php

declare(strict_types=1);

namespace App\Helpers;

/**
 * Resolves the dashboard's period filter (?range=...&from=...&to=...&group=...)
 * into a concrete inclusive [from, to] pair of Y-m-d dates plus a grouping
 * granularity (day / week / month / half / year) for the table and charts.
 * Weeks are ISO weeks (Monday first); halves are Jan-Jun / Jul-Dec.
 */
final class DateRange
{
    public const PRESETS = [
        'today', 'yesterday', '7d', '30d', 'this_week', 'prev_week', 'this_month', 'prev_month',
        'this_half', 'prev_half', 'this_year', 'prev_year', 'custom',
    ];
    public const GROUPS = ['day', 'week', 'month', 'half', 'year'];

    private function __construct(
        public readonly string $preset,
        public readonly string $from,
        public readonly string $to,
        public readonly string $group
    ) {
    }

    public static function fromRequest(array $query, ?\DateTimeImmutable $today = null): self
    {
        $today ??= new \DateTimeImmutable('today');
        $preset = in_array($query['range'] ?? '', self::PRESETS, true) ? (string) $query['range'] : 'this_month';
        [$from, $to] = self::resolve($preset, $query, $today);
        if ($from === null) {
            $preset = 'this_month';
            [$from, $to] = self::resolve($preset, [], $today);
        }
        $group = in_array($query['group'] ?? '', self::GROUPS, true) ? (string) $query['group'] : self::defaultGroup($from, $to);

        return new self($preset, $from, $to, $group);
    }

    /** @return array{0: ?string, 1: ?string} */
    private static function resolve(string $preset, array $query, \DateTimeImmutable $today): array
    {
        $f = static fn (\DateTimeImmutable $d): string => $d->format('Y-m-d');
        $year = (int) $today->format('Y');
        $firstHalf = (int) $today->format('n') <= 6;

        return match ($preset) {
            'today' => [$f($today), $f($today)],
            'yesterday' => [$f($today->modify('-1 day')), $f($today->modify('-1 day'))],
            '7d' => [$f($today->modify('-6 days')), $f($today)],
            '30d' => [$f($today->modify('-29 days')), $f($today)],
            'this_week' => [$f($today->modify('monday this week')), $f($today)],
            'prev_week' => [$f($today->modify('monday this week')->modify('-7 days')), $f($today->modify('monday this week')->modify('-1 day'))],
            'this_month' => [$f($today->modify('first day of this month')), $f($today)],
            'prev_month' => [$f($today->modify('first day of last month')), $f($today->modify('last day of last month'))],
            'this_half' => [$firstHalf ? "$year-01-01" : "$year-07-01", $f($today)],
            'prev_half' => $firstHalf ? [($year - 1) . '-07-01', ($year - 1) . '-12-31'] : ["$year-01-01", "$year-06-30"],
            'this_year' => ["$year-01-01", $f($today)],
            'prev_year' => [($year - 1) . '-01-01', ($year - 1) . '-12-31'],
            'custom' => self::custom($query),
            default => [null, null],
        };
    }

    /** @return array{0: ?string, 1: ?string} */
    private static function custom(array $query): array
    {
        $from = self::validDate($query['from'] ?? null);
        $to = self::validDate($query['to'] ?? null);
        if ($from === null || $to === null || $from > $to) {
            return [null, null];
        }
        return [$from, $to];
    }

    private static function defaultGroup(string $from, string $to): string
    {
        $days = (int) (new \DateTimeImmutable($from))->diff(new \DateTimeImmutable($to))->days + 1;
        return match (true) {
            $days <= 45 => 'day',
            $days <= 120 => 'week',
            $days <= 800 => 'month',
            default => 'year',
        };
    }

    /** Bucket key for a Y-m-d date at this range's granularity (sortable). */
    public function bucketKey(string $date, ?string $group = null): string
    {
        $d = new \DateTimeImmutable($date);
        return match ($group ?? $this->group) {
            'week' => $d->format('o-\WW'),
            'month' => $d->format('Y-m'),
            'half' => $d->format('Y') . '-H' . ((int) $d->format('n') <= 6 ? '1' : '2'),
            'year' => $d->format('Y'),
            default => $d->format('Y-m-d'),
        };
    }

    /** Hungarian label for a bucket key produced by bucketKey(). */
    public static function bucketLabel(string $key, string $group): string
    {
        if ($group === 'week' && preg_match('/^(\d{4})-W(\d{2})$/', $key, $m)) {
            $monday = (new \DateTimeImmutable())->setISODate((int) $m[1], (int) $m[2]);
            return sprintf('%s. %d. hét (%s-%s)', $m[1], (int) $m[2], $monday->format('m.d'), $monday->modify('+6 days')->format('m.d'));
        }
        if ($group === 'half' && preg_match('/^(\d{4})-H([12])$/', $key, $m)) {
            return $m[1] . '. ' . ($m[2] === '1' ? 'I. félév' : 'II. félév');
        }
        if ($group === 'month') {
            return str_replace('-', '.', $key) . '.';
        }
        if ($group === 'year') {
            return $key . '.';
        }
        return str_replace('-', '.', $key) . '.';
    }

    private static function validDate(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }
        $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        return ($date && $date->format('Y-m-d') === $value) ? $value : null;
    }
}
