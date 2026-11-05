<?php

declare(strict_types=1);

require __DIR__ . '/../app/Core/Autoloader.php';
require __DIR__ . '/TestKit.php';

\App\Core\Autoloader::register('App', __DIR__ . '/../app');

use App\Services\TurumPriceMapper;

$t = new TestKit('TurumPriceMapper');
$m = new TurumPriceMapper();

$t->assertSame('FN6245-100-9', TurumPriceMapper::key('fn6245-100', '9'), 'key = UPPER(sku-size)');
$t->assertSame('DD1391-100-9-5', TurumPriceMapper::key('DD1391-100', '9.5'), 'a dot in the size becomes a dash');

$rows = $m->variantRows([
    ['sku' => 'DD1391-100', 'price' => 90, 'variants' => [
        ['variant_id' => 'a', 'size' => '9.5', 'eu_size' => '43', 'stock' => 3, 'price' => 88.5],
        ['variant_id' => 'b', 'size' => '10', 'stock' => 0, 'price' => 0],
        ['variant_id' => 'c', 'size' => '', 'price' => 70],
    ]],
    ['sku' => '', 'variants' => [['size' => '1', 'price' => 1]]],
    'garbage',
]);
$t->assertSame(['DD1391-100-9-5'], array_keys($rows), 'only priced variants with a size and a parent sku are kept');
$t->assertSame('88.5000', $rows['DD1391-100-9-5']['price'], 'price normalized to 4 decimals');
$t->assertSame(3, $rows['DD1391-100-9-5']['stock'], 'stock kept');

exit($t->summary() ? 0 : 1);
