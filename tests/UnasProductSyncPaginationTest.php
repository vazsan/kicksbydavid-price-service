<?php

declare(strict_types=1);

require __DIR__ . '/../app/Core/Autoloader.php';
require __DIR__ . '/TestKit.php';

\App\Core\Autoloader::register('App', __DIR__ . '/../app');

use App\Services\UnasProductSyncPagination;

$pagination = new UnasProductSyncPagination();
$t = new TestKit('UnasProductSyncPagination');

const TEST_PAGE_SIZE = 50;

// --- resolveStartOffset(): --start-page vs --start-offset precedence ---
$t->assertSame(0, $pagination->resolveStartOffset(null, null, TEST_PAGE_SIZE), 'neither flag given: start offset is 0 (original default behavior)');
$t->assertSame(10000, $pagination->resolveStartOffset(200, null, TEST_PAGE_SIZE), '--start-page=200 resolves to offset 200*50=10000 ("200 pages already completed")');
$t->assertSame(10000, $pagination->resolveStartOffset(null, 10000, TEST_PAGE_SIZE), '--start-offset=10000 resolves directly to 10000');
$t->assertSame(10000, $pagination->resolveStartOffset(200, 10000, TEST_PAGE_SIZE), '--start-page=200 and --start-offset=10000 given together agree (the confirmed production resume scenario)');
$t->assertSame(9999, $pagination->resolveStartOffset(200, 9999, TEST_PAGE_SIZE), 'when the two disagree, --start-offset takes precedence (the more precise of the two)');
$t->assertSame(0, $pagination->resolveStartOffset(-5, null, TEST_PAGE_SIZE), 'a negative --start-page never produces a negative offset');
$t->assertSame(0, $pagination->resolveStartOffset(null, -5, TEST_PAGE_SIZE), 'a negative --start-offset never produces a negative offset');

// --- limitStartForLocalPage(): LimitStart = start_offset + (local_page_index * PAGE_SIZE) ---
$t->assertSame(0, $pagination->limitStartForLocalPage(0, 0, TEST_PAGE_SIZE), 'no resume, first local page: LimitStart=0 (original behavior unchanged)');
$t->assertSame(50, $pagination->limitStartForLocalPage(0, 1, TEST_PAGE_SIZE), 'no resume, second local page: LimitStart=50');
$t->assertSame(9950, $pagination->limitStartForLocalPage(0, 199, TEST_PAGE_SIZE), 'no resume, local page index 199 (the 200th page): LimitStart=9950 - matches the confirmed production run\'s last page');
$t->assertSame(10000, $pagination->limitStartForLocalPage(10000, 0, TEST_PAGE_SIZE), 'resumed at offset 10000, first local page: LimitStart=10000 (the exact confirmed continuation point)');
$t->assertSame(10050, $pagination->limitStartForLocalPage(10000, 1, TEST_PAGE_SIZE), 'resumed at offset 10000, second local page: LimitStart=10050');

// --- logicalPageNumber(): 1-indexed, consistent regardless of where a run started ---
$t->assertSame(1, $pagination->logicalPageNumber(0, TEST_PAGE_SIZE), 'LimitStart=0 is logical page 1');
$t->assertSame(200, $pagination->logicalPageNumber(9950, TEST_PAGE_SIZE), 'LimitStart=9950 is logical page 200 - the last page of the confirmed production run');
$t->assertSame(201, $pagination->logicalPageNumber(10000, TEST_PAGE_SIZE), 'LimitStart=10000 is logical page 201 - exactly the example given ("Page 201 (LimitStart=10000)")');

// --- End-to-end: resuming with --start-page=200 reproduces the exact
// documented example "Page 201 (LimitStart=10000): 50 product(s)." ---
$startOffset = $pagination->resolveStartOffset(200, null, TEST_PAGE_SIZE);
$firstResumedLimitStart = $pagination->limitStartForLocalPage($startOffset, 0, TEST_PAGE_SIZE);
$firstResumedPageNumber = $pagination->logicalPageNumber($firstResumedLimitStart, TEST_PAGE_SIZE);
$t->assertSame(10000, $firstResumedLimitStart, 'end-to-end: --start-page=200, first fetch of the resumed run has LimitStart=10000');
$t->assertSame(201, $firstResumedPageNumber, 'end-to-end: --start-page=200, first fetch of the resumed run is labeled logical Page 201');

exit($t->summary() ? 0 : 1);
