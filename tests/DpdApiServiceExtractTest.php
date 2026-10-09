<?php

declare(strict_types=1);

require __DIR__ . '/../app/Core/Autoloader.php';
require __DIR__ . '/TestKit.php';

\App\Core\Autoloader::register('App', __DIR__ . '/../app');

use App\Services\DpdApiService;

$dpd = new DpdApiService('login', 'password', '458231');
$t = new TestKit('DpdApiService extraction');

// The real DPD Polska generatePackagesNumbersV4 shape: PascalCase, with
// Packages.Package[] and Parcels.Parcel[] wrappers (confirmed live).
$numbersResponse = [
    'return' => [
        'Status' => 'OK',
        'SessionId' => 1455294048,
        'Packages' => [
            'Package' => [
                [
                    'Status' => 'OK',
                    'PackageId' => 1370894780,
                    'Parcels' => [
                        'Parcel' => [
                            ['Status' => 'OK', 'ParcelId' => 1486133633, 'Waybill' => '13089306855702'],
                        ],
                    ],
                ],
            ],
        ],
    ],
];

$t->assertSame('1455294048', $dpd->extractSessionId($numbersResponse), 'sessionId read from PascalCase SessionId');
$t->assertSame(['13089306855702'], $dpd->extractWaybills($numbersResponse), 'waybill read from Packages.Package.Parcels.Parcel.Waybill');
$t->assertSame('OK', $dpd->extractStatus($numbersResponse), 'status read from Status');

// A validation failure response carries no waybill.
$failResponse = [
    'return' => [
        'Status' => 'INCORRECT_DATA',
        'Packages' => ['Package' => [['Status' => 'INCORRECT_DATA', 'Parcels' => ['Parcel' => [['Status' => 'OK']]]]]],
    ],
];
$t->assertSame([], $dpd->extractWaybills($failResponse), 'no waybill on a validation failure');

// Validation messages (ErrorCode + Info) are collected from anywhere.
$validationResponse = [
    'return' => [
        'Status' => 'INCORRECT_DATA',
        'Packages' => ['Package' => [[
            'Status' => 'INCORRECT_DATA',
            'ValidationDetails' => ['ValidationInfo' => [
                ['ErrorId' => 1506, 'ErrorCode' => 'INCORRECT_SENDER_POSTAL_CODE', 'Info' => 'Niepoprawny format'],
                ['Info' => 'COD not available'],
            ]],
        ]]],
    ],
];
$msgs = $dpd->extractValidationMessages($validationResponse);
$t->assertTrue(in_array('INCORRECT_SENDER_POSTAL_CODE Niepoprawny format', $msgs, true), 'validation code+info extracted');
$t->assertTrue(in_array('COD not available', $msgs, true), 'validation info-only extracted');

// Label PDF: documentData (base64) found at any depth/casing.
$labelResponse = ['return' => ['documentData' => base64_encode('%PDF-1.4 fake')]];
$t->assertSame('%PDF-1.4 fake', $dpd->extractLabelPdf($labelResponse), 'label PDF decoded from documentData');
$t->assertNull($dpd->extractLabelPdf(['return' => ['Status' => 'OK']]), 'no PDF when documentData absent');

exit($t->summary() ? 0 : 1);
