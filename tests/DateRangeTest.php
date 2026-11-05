<?php

declare(strict_types=1);

require __DIR__ . '/../app/Core/Autoloader.php';
require __DIR__ . '/TestKit.php';

\App\Core\Autoloader::register('App', __DIR__ . '/../app');

use App\Helpers\DateRange;

$t = new TestKit('DateRange');
$today = new DateTimeImmutable('2026-11-05'); // a Thursday

$r = DateRange::fromRequest([], $today);
$t->assertSame(['this_month', '2026-11-01', '2026-11-05', 'day'], [$r->preset, $r->from, $r->to, $r->group], 'default = this month, daily');
$r = DateRange::fromRequest(['range' => 'this_week'], $today);
$t->assertSame(['2026-11-02', '2026-11-05'], [$r->from, $r->to], 'this week starts on Monday');
$r = DateRange::fromRequest(['range' => 'prev_week'], $today);
$t->assertSame(['2026-10-26', '2026-11-01'], [$r->from, $r->to], 'previous ISO week');
$r = DateRange::fromRequest(['range' => 'this_half'], $today);
$t->assertSame(['2026-07-01', '2026-11-05', 'month'], [$r->from, $r->to, $r->group], 'second half-year (128 days), monthly by default');
$r = DateRange::fromRequest(['range' => 'prev_half'], $today);
$t->assertSame(['2026-01-01', '2026-06-30'], [$r->from, $r->to], 'previous half-year');
$r = DateRange::fromRequest(['range' => 'this_year', 'group' => 'half'], $today);
$t->assertSame(['2026-01-01', '2026-11-05', 'half'], [$r->from, $r->to, $r->group], 'explicit group wins');
$r = DateRange::fromRequest(['range' => 'custom', 'from' => '2026-10-01', 'to' => '2026-10-31'], $today);
$t->assertSame(['custom', '2026-10-01', '2026-10-31'], [$r->preset, $r->from, $r->to], 'custom range');
$r = DateRange::fromRequest(['range' => 'custom', 'from' => '2026-10-31', 'to' => '2026-10-01'], $today);
$t->assertSame('this_month', $r->preset, 'inverted custom range falls back to this month');

$t->assertSame('2026-W45', $r->bucketKey('2026-11-05', 'week'), 'ISO week bucket');
$t->assertSame('2026-H2', $r->bucketKey('2026-11-05', 'half'), 'half-year bucket');
$t->assertSame('2026. 45. hét (11.02-11.08)', DateRange::bucketLabel('2026-W45', 'week'), 'Hungarian week label');
$t->assertSame('2026. II. félév', DateRange::bucketLabel('2026-H2', 'half'), 'Hungarian half-year label');

exit($t->summary() ? 0 : 1);
