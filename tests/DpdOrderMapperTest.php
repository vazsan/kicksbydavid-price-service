<?php

declare(strict_types=1);

require __DIR__ . '/../app/Core/Autoloader.php';
require __DIR__ . '/TestKit.php';

\App\Core\Autoloader::register('App', __DIR__ . '/../app');

use App\Services\DpdOrderMapper;

$orderFactory = require __DIR__ . '/fixtures/dpd_unas_order.php';
$mapper = new DpdOrderMapper();
$t = new TestKit('DpdOrderMapper');

$sender = [
    'fid' => '458231',
    'company' => 'Kicks Sp. z o.o.',
    'name' => 'Magazyn',
    'address' => 'ul. Przykladowa 5',
    'city' => 'Warszawa',
    'postal_code' => '00-001',
    'country_code' => 'PL',
    'phone' => '+48 22 000 0000',
    'email' => 'wysylka@example.com',
];

// --- resolveCountryCode ----------------------------------------------
$t->assertSame('HU', $mapper->resolveCountryCode('Magyarország'), 'Hungarian country name -> HU');
$t->assertSame('HU', $mapper->resolveCountryCode('magyarorszag'), 'accent-folded name -> HU');
$t->assertSame('PL', $mapper->resolveCountryCode('pl'), 'two-letter code is accepted and upper-cased');
$t->assertSame('DE', $mapper->resolveCountryCode('Germany'), 'English name -> DE');
$t->assertNull($mapper->resolveCountryCode('Freedonia'), 'unknown country -> null (never guessed)');

// --- buildReceiver ----------------------------------------------------
$receiver = $mapper->buildReceiver($orderFactory());
$t->assertSame('Kiss Péter', $receiver['name'], 'receiver name from Shipping');
$t->assertSame('Bajcsy-Zsilinszky út 12', $receiver['address'], 'receiver street from Shipping');
$t->assertSame('Budapest', $receiver['city'], 'receiver city from Shipping');
$t->assertSame('1051', $receiver['postalCode'], 'receiver postal code from <ZIP>');
$t->assertSame('HU', $receiver['countryCode'], 'receiver country resolved to ISO');
$t->assertSame('+36 30 123 4567', $receiver['phone'], 'receiver phone from Contact');
$t->assertSame('kontakt@example.com', $receiver['email'], 'receiver email from Contact (preferred over Customer.Email)');

// --- buildPackage: overall shape -------------------------------------
$package = $mapper->buildPackage($orderFactory(), $sender, ['default_weight_kg' => 1.5]);
$t->assertSame(1, count($package['packages']), 'one package built');
$pkg = $package['packages'][0];
$t->assertSame('SENDER', $pkg['payerType'], 'payerType defaults to SENDER');
$t->assertSame('ORD-2026-0007', $pkg['ref1'], 'ref1 is the order Key');
$t->assertSame('458231', $pkg['sender']['fid'], 'sender fid carried through');
$t->assertSame('PL', $pkg['sender']['countryCode'], 'sender country resolved');
$t->assertSame(1.5, $pkg['parcels'][0]['weight'], 'default parcel weight used when order has none');
$t->assertSame('Nike Air Max 90 (42)', $pkg['parcels'][0]['content'], 'parcel content from first item name');

// --- COD gating -------------------------------------------------------
$t->assertTrue(
    !isset($package['packages'][0]['services']),
    'no COD requested when cod_payment_methods is empty'
);

$codPackage = $mapper->buildPackage($orderFactory(), $sender, [
    'cod_payment_methods' => ['utánvét'],
    'cod_currency' => 'HUF',
]);
$cod = $codPackage['packages'][0]['services']['cod'] ?? null;
$t->assertTrue($cod !== null, 'COD requested when payment name matches a configured method');
$t->assertSame(28990.0, $cod['amount'] ?? null, 'COD amount is the order gross total');
$t->assertSame('HUF', $cod['currency'] ?? null, 'COD currency from options');

// --- sessionType ------------------------------------------------------
$t->assertSame('INTERNATIONAL', $mapper->resolveSessionType($orderFactory(), $sender), 'PL sender + HU receiver -> INTERNATIONAL');
$plSender = $sender;
$plReceiverOrder = $orderFactory();
$plReceiverOrder['Customer']['Addresses']['Shipping']['Country'] = 'Polska';
$plReceiverOrder['Customer']['Addresses']['Shipping']['ZIP'] = '00-950';
$t->assertSame('DOMESTIC', $mapper->resolveSessionType($plReceiverOrder, $plSender), 'PL sender + PL receiver -> DOMESTIC');

// --- Shipping -> Invoice fallback ------------------------------------
$noShipping = $orderFactory();
$noShipping['Customer']['Addresses']['Shipping'] = [];
$fallback = $mapper->buildReceiver($noShipping);
$t->assertSame('Számla utca 1', $fallback['address'], 'falls back to Invoice address when Shipping is empty');

// --- validation: missing required field throws -----------------------
$broken = $orderFactory();
$broken['Customer']['Addresses']['Shipping'] = [];
$broken['Customer']['Addresses']['Invoice'] = [];
$t->assertThrows(
    static fn () => $mapper->buildReceiver($broken),
    'missing receiver fields raise an error instead of a blank label'
);

// --- COD via Payment.Type='cod' + currency from the order ------------
$codTypeOrder = $orderFactory();
$codTypeOrder['Payment'] = ['Type' => 'cod', 'Name' => 'Utánvét (+1.100 ft)'];
$codTypeOrder['Currency'] = 'EUR';
$codPkg2 = $mapper->buildPackage($codTypeOrder, $sender, ['cod_payment_methods' => ['cod'], 'cod_currency' => 'PLN']);
$cod2 = $codPkg2['packages'][0]['services']['cod'] ?? null;
$t->assertTrue($cod2 !== null, 'COD detected from Payment.Type=cod');
$t->assertSame('EUR', $cod2['currency'] ?? null, 'COD currency comes from the order currency, not the config fallback');

// --- street number already in <Street> is not duplicated -------------
$streetOrder = $orderFactory();
$streetOrder['Customer']['Addresses']['Shipping']['Street'] = 'Vyhonska 1';
$streetOrder['Customer']['Addresses']['Shipping']['StreetName'] = 'Vyhonska';
$streetOrder['Customer']['Addresses']['Shipping']['StreetNumber'] = '1';
$t->assertSame('Vyhonska 1', $mapper->buildReceiver($streetOrder)['address'], 'Street used as-is, house number not duplicated');

// --- sender without FID throws ---------------------------------------
$t->assertThrows(
    static fn () => $mapper->buildSender(['country_code' => 'PL']),
    'sender without a FID is rejected'
);

exit($t->summary() ? 0 : 1);
