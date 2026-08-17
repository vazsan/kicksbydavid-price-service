<?php

declare(strict_types=1);

/**
 * Exercises UnasApiService::decodeBody() (private - invoked via
 * Reflection) against real CDATA-wrapped XML confirmed from a live
 * production order. decodeBody() itself does no I/O, so this needs no
 * database/App::bootstrap() - only the class needs to be loadable.
 */

require __DIR__ . '/../app/Core/Autoloader.php';
require __DIR__ . '/TestKit.php';

\App\Core\Autoloader::register('App', __DIR__ . '/../app');

use App\Services\UnasApiService;

$t = new TestKit('UnasApiService::decodeBody (CDATA)');

// Constructing UnasApiService does not touch the network or the
// database - only request()/authenticate() do - so this is safe to use
// directly in a dependency-free test.
$service = new UnasApiService('unused-in-this-test', 'https://api.unas.eu/shop', 60);

$decodeBody = new \ReflectionMethod($service, 'decodeBody');
$decodeBody->setAccessible(true);

// --- Confirmed live CDATA-wrapped fields ---
$cdataXml = <<<'XML'
<Order>
    <Id>364978426</Id>
    <Status><![CDATA[Megrendelés lezárva]]></Status>
    <StatusID><![CDATA[6031571]]></StatusID>
    <StatusType><![CDATA[close_ok]]></StatusType>
</Order>
XML;

$decoded = $decodeBody->invoke($service, $cdataXml);

$t->assertSame('Megrendelés lezárva', $decoded['Status'] ?? null, 'CDATA-wrapped <Status> decodes to its real scalar string, not an empty array');
$t->assertSame('6031571', $decoded['StatusID'] ?? null, 'CDATA-wrapped <StatusID> decodes to its real scalar string');
$t->assertSame('close_ok', $decoded['StatusType'] ?? null, 'CDATA-wrapped <StatusType> decodes to its real scalar string');

// --- Regression check: without the fix, CDATA fields decode to an empty array ---
$t->assertTrue(!is_array($decoded['Status'] ?? 'not-array'), 'Status is a scalar, not the empty array CDATA decodes to without LIBXML_NOCDATA');

// --- Non-CDATA field must still decode correctly (no regression) ---
$plainXml = <<<'XML'
<Order>
    <Id>500123</Id>
    <Currency>EUR</Currency>
</Order>
XML;

$plainDecoded = $decodeBody->invoke($service, $plainXml);
$t->assertSame('500123', $plainDecoded['Id'] ?? null, 'a normal non-CDATA <Id> still decodes to a scalar string');
$t->assertSame('EUR', $plainDecoded['Currency'] ?? null, 'a normal non-CDATA <Currency> still decodes to a scalar string');

// --- Mixed order: some CDATA fields, some plain, in the same document ---
$mixedXml = <<<'XML'
<Order>
    <Id>364978426</Id>
    <Currency>HUF</Currency>
    <Status><![CDATA[Megrendelés lezárva]]></Status>
</Order>
XML;

$mixedDecoded = $decodeBody->invoke($service, $mixedXml);
$t->assertSame('HUF', $mixedDecoded['Currency'] ?? null, 'a plain field next to a CDATA field still decodes correctly');
$t->assertSame('Megrendelés lezárva', $mixedDecoded['Status'] ?? null, 'the CDATA field in the same document decodes correctly too');

// --- Empty body still returns an empty array (unchanged behavior) ---
$t->assertSame([], $decodeBody->invoke($service, ''), 'an empty response body still decodes to an empty array');

// --- End-to-end: the exact reported symptom (order status mapping to
// "unknown") is fixed once decodeBody() correctly resolves CDATA ---
$orderXml = <<<'XML'
<Order>
    <Id>364978426</Id>
    <Date>2026.03.24 20:15:35</Date>
    <Status><![CDATA[Megrendelés lezárva]]></Status>
    <StatusID><![CDATA[6031571]]></StatusID>
    <StatusType><![CDATA[close_ok]]></StatusType>
</Order>
XML;
$orderDecoded = $decodeBody->invoke($service, $orderXml);
$header = (new \App\Services\UnasOrderMapper())->mapOrderHeader($orderDecoded, 'EUR');

$t->assertSame('Megrendelés lezárva', $header['status'], 'a CDATA-wrapped order status maps to its real value, not the "unknown" fallback');
$t->assertSame('6031571', $header['status_id'], 'a CDATA-wrapped StatusID maps correctly end-to-end');
$t->assertSame('close_ok', $header['status_type'], 'a CDATA-wrapped StatusType maps correctly end-to-end');

exit($t->summary() ? 0 : 1);
