<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Pure mapping from a decoded UNAS getOrder record to the DPD Polska
 * openUMLFeV3 package structure that DpdApiService::generatePackageNumbers()
 * expects. No I/O, no DB, no SOAP - so it is unit-testable (see
 * tests/DpdOrderMapperTest.php), exactly like UnasOrderMapper.
 *
 * The UNAS side: a getOrder <Order> carries the recipient under
 *   <Customer>
 *     <Email>
 *     <Contact><Name><Phone><Mobile><Email></Contact>
 *     <Addresses>
 *       <Shipping><Name><Company><Country><ZIP><City><Street>...</Shipping>
 *       <Invoice> ... same shape ... </Invoice>
 *     </Addresses>
 *   </Customer>
 * These tag names follow UNAS's documented getOrder schema. Because the
 * analytics importer never needed the address, the exact tags had not
 * been exercised against a live sample in this codebase before - so this
 * mapper reads defensively (Shipping first, Invoice as fallback; several
 * accepted spellings per field) and, crucially, VALIDATES: a missing
 * required field raises a clear error naming it, instead of silently
 * producing a blank label. Confirm the field names with a --dry-run of
 * scripts/generate_dpd_label.php against a real order before going live.
 *
 * The DPD side: openUMLFeV3 = { packages: [ {
 *     parcels: [ { weight, content, customerData1 } ],
 *     payerType, ref1,
 *     receiver: { name, company, address, city, postalCode, countryCode, phone, email },
 *     sender:   { fid, name, company, address, city, postalCode, countryCode, phone, email },
 *     services: { cod: { amount, currency } }   // only when COD applies
 * } ] }.
 */
final class DpdOrderMapper
{
    /**
     * Localized country name -> ISO 3166-1 alpha-2. Covers the countries
     * a Central-European shop realistically ships to; an unrecognized
     * name that is not already a 2-letter code is rejected by
     * resolveCountryCode() rather than guessed.
     *
     * @var array<string, string>
     */
    private const COUNTRY_NAME_TO_ISO = [
        'magyarorszag' => 'HU', 'magyarország' => 'HU', 'hungary' => 'HU',
        'lengyelorszag' => 'PL', 'lengyelország' => 'PL', 'poland' => 'PL', 'polska' => 'PL',
        'ausztria' => 'AT', 'austria' => 'AT',
        'szlovakia' => 'SK', 'szlovákia' => 'SK', 'slovakia' => 'SK', 'slovensko' => 'SK',
        'csehorszag' => 'CZ', 'csehország' => 'CZ', 'czechia' => 'CZ', 'czech republic' => 'CZ',
        'romania' => 'RO', 'románia' => 'RO',
        'nemetorszag' => 'DE', 'németország' => 'DE', 'germany' => 'DE', 'deutschland' => 'DE',
        'horvatorszag' => 'HR', 'horvátország' => 'HR', 'croatia' => 'HR',
        'szlovenia' => 'SI', 'szlovénia' => 'SI', 'slovenia' => 'SI',
        'szerbia' => 'RS', 'serbia' => 'RS',
        'szlovak koztarsasag' => 'SK',
    ];

    /**
     * Builds the full openUMLFeV3 structure for a single-package shipment.
     *
     * @param array<string, mixed> $order        One decoded UNAS <Order>.
     * @param array<string, mixed> $sender        Sender block from config
     *     ('dpd.sender' + 'dpd.sender_fid'): fid, company, name, address,
     *     city, postal_code, country_code, phone, email.
     * @param array{
     *     default_weight_kg?: float,
     *     cod_payment_methods?: array<int, string>,
     *     cod_currency?: string
     * } $options
     * @return array<string, mixed>
     */
    public function buildPackage(array $order, array $sender, array $options = []): array
    {
        $receiver = $this->buildReceiver($order);
        $senderBlock = $this->buildSender($sender);

        $parcel = [
            'weight' => $this->resolveWeightKg($order, (float) ($options['default_weight_kg'] ?? 1.0)),
            'content' => $this->buildContent($order),
            'customerData1' => $this->orderReference($order),
        ];

        $package = [
            'parcels' => [$parcel],
            'payerType' => 'SENDER',
            'ref1' => $this->orderReference($order),
            'receiver' => $receiver,
            'sender' => $senderBlock,
        ];

        $cod = $this->buildCod($order, $options);
        if ($cod !== null) {
            $package['services'] = ['cod' => $cod];
        }

        return ['packages' => [$package]];
    }

    /**
     * 'DOMESTIC' when sender and receiver share a country, else
     * 'INTERNATIONAL' - the sessionType generateSpedLabels needs.
     *
     * @param array<string, mixed> $order
     * @param array<string, mixed> $sender
     */
    public function resolveSessionType(array $order, array $sender): string
    {
        $receiverCountry = $this->buildReceiver($order)['countryCode'];
        $senderCountry = strtoupper((string) ($sender['country_code'] ?? ''));

        return $receiverCountry === $senderCountry ? 'DOMESTIC' : 'INTERNATIONAL';
    }

    // -----------------------------------------------------------------
    // Receiver / sender
    // -----------------------------------------------------------------

    /**
     * @param array<string, mixed> $order
     * @return array<string, string>
     */
    public function buildReceiver(array $order): array
    {
        $customer = $this->arr($order['Customer'] ?? null);
        $addresses = $this->arr($customer['Addresses'] ?? null);
        $shipping = $this->arr($addresses['Shipping'] ?? null);
        $invoice = $this->arr($addresses['Invoice'] ?? null);
        $contact = $this->arr($customer['Contact'] ?? null);

        // Shipping address wins; fall back field-by-field to the invoice
        // address so a partial shipping block still produces a label.
        $pick = fn (array $keys): ?string => $this->firstScalar($shipping, $keys) ?? $this->firstScalar($invoice, $keys);

        $name = $pick(['Name', 'ContactName', 'FullName'])
            ?? $this->firstScalar($contact, ['Name']);
        $company = $pick(['Company', 'CompanyName']);
        $street = $pick(['Street', 'Address', 'Address1']);
        $houseNumber = $pick(['StreetNumber', 'HouseNumber', 'Number']);
        $city = $pick(['City', 'Town']);
        $postalCode = $pick(['ZIP', 'Zip', 'PostalCode', 'PostCode', 'Postcode', 'ZipCode']);
        $countryRaw = $pick(['CountryCode', 'Country', 'CountryName']);
        $phone = $this->firstScalar($contact, ['Phone', 'Mobile', 'Tel', 'Telephone'])
            ?? $pick(['Phone', 'Mobile']);
        $email = $this->firstScalar($contact, ['Email'])
            ?? $this->firstScalar($customer, ['Email'])
            ?? $this->firstScalar($order, ['Email']);

        // UNAS's <Street> already includes the house number (e.g. "Vyhonska 1"),
        // so it is used as-is. Only when no complete street line exists do we
        // build one from the split <StreetName> + <StreetNumber>, to avoid
        // duplicating the number ("Vyhonska 1 1").
        if ($street === null) {
            $streetName = $pick(['StreetName']);
            if ($streetName !== null) {
                $street = trim($streetName . ' ' . ($houseNumber ?? ''));
            }
        }

        $countryCode = $countryRaw !== null ? $this->resolveCountryCode($countryRaw) : null;

        $receiver = [
            'name' => $this->clean($name),
            'company' => $this->clean($company),
            'address' => $this->clean($street),
            'city' => $this->clean($city),
            'postalCode' => $this->normalizePostalCode($postalCode),
            'countryCode' => $countryCode ?? '',
            'phone' => $this->clean($phone),
            'email' => $this->clean($email),
        ];

        $this->assertReceiverComplete($order, $receiver, $countryRaw);

        return array_map(static fn ($v) => (string) $v, $receiver);
    }

    /**
     * @param array<string, mixed> $sender
     * @return array<string, string>
     */
    public function buildSender(array $sender): array
    {
        $fid = (string) ($sender['fid'] ?? '');
        if ($fid === '') {
            throw new \RuntimeException('DPD sender FID is not configured (DPD_SENDER_FID).');
        }

        $countryCode = $this->resolveCountryCode((string) ($sender['country_code'] ?? 'PL')) ?? 'PL';

        return [
            'fid' => $fid,
            'name' => (string) ($sender['name'] ?? ''),
            'company' => (string) ($sender['company'] ?? ''),
            'address' => (string) ($sender['address'] ?? ''),
            'city' => (string) ($sender['city'] ?? ''),
            'postalCode' => $this->normalizePostalCode((string) ($sender['postal_code'] ?? '')),
            'countryCode' => $countryCode,
            'phone' => (string) ($sender['phone'] ?? ''),
            'email' => (string) ($sender['email'] ?? ''),
        ];
    }

    // -----------------------------------------------------------------
    // Field helpers
    // -----------------------------------------------------------------

    /**
     * Maps a country name or code to ISO alpha-2, or null if it cannot be
     * resolved. An input already shaped like a 2-letter code is accepted
     * as-is (upper-cased).
     */
    public function resolveCountryCode(string $value): ?string
    {
        $trimmed = trim($value);
        if ($trimmed === '') {
            return null;
        }

        if (preg_match('/^[A-Za-z]{2}$/', $trimmed) === 1) {
            return strtoupper($trimmed);
        }

        $key = $this->foldCountryKey($trimmed);

        return self::COUNTRY_NAME_TO_ISO[$key] ?? null;
    }

    private function foldCountryKey(string $name): string
    {
        $lower = mb_strtolower(trim($name));
        // Normalize common Hungarian accents so "Magyarország" and
        // "Magyarorszag" both resolve, without needing ext-intl.
        $map = ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ö' => 'o', 'ő' => 'o', 'ú' => 'u', 'ü' => 'u', 'ű' => 'u'];

        return strtr($lower, $map);
    }

    /**
     * @param array<string, mixed> $order
     */
    private function resolveWeightKg(array $order, float $default): float
    {
        $weight = $order['Weight'] ?? ($order['WeightTotal'] ?? null);
        if (is_numeric($weight) && (float) $weight > 0) {
            return round((float) $weight, 3);
        }

        return $default > 0 ? $default : 1.0;
    }

    /**
     * @param array<string, mixed> $order
     */
    private function buildContent(array $order): string
    {
        $items = $order['Items']['Item'] ?? null;
        $list = ($items !== null && is_array($items))
            ? (array_is_list($items) ? $items : [$items])
            : [];

        foreach ($list as $item) {
            if (is_array($item)) {
                $name = $this->firstScalar($item, ['Name']);
                if ($name !== null && $name !== '') {
                    return mb_substr($name, 0, 50);
                }
            }
        }

        return 'goods';
    }

    /**
     * @param array<string, mixed> $order
     */
    private function orderReference(array $order): string
    {
        $ref = $this->firstScalar($order, ['Key', 'Id']);

        return $ref !== null ? mb_substr($ref, 0, 27) : '';
    }

    /**
     * @param array{cod_payment_methods?: array<int, string>, cod_currency?: string} $options
     * @param array<string, mixed> $order
     * @return array{amount: float, currency: string}|null
     */
    private function buildCod(array $order, array $options): ?array
    {
        $methods = $options['cod_payment_methods'] ?? [];
        if ($methods === []) {
            return null;
        }

        $payment = $this->arr($order['Payment'] ?? null);
        $paymentName = mb_strtolower((string) ($this->firstScalar($payment, ['Type', 'Name']) ?? ''));
        if ($paymentName === '') {
            return null;
        }

        $isCod = false;
        foreach ($methods as $needle) {
            $needle = mb_strtolower(trim((string) $needle));
            if ($needle !== '' && str_contains($paymentName, $needle)) {
                $isCod = true;
                break;
            }
        }

        if (!$isCod) {
            return null;
        }

        $amount = $this->firstScalar($order, ['SumPriceGross', 'GrandTotal', 'SumGross']);
        if ($amount === null || !is_numeric($amount) || (float) $amount <= 0) {
            throw new \RuntimeException(
                'Order ' . $this->orderReference($order) . ' looks like cash-on-delivery but has no positive total to collect.'
            );
        }

        // COD is collected in the order's own currency (an SK order is in
        // EUR, a HU order in HUF, ...). The configured cod_currency is only a
        // fallback for an order that somehow carries no <Currency>.
        $orderCurrency = $this->firstScalar($order, ['Currency']);
        $currency = ($orderCurrency !== null && $orderCurrency !== '')
            ? $orderCurrency
            : (string) ($options['cod_currency'] ?? 'EUR');

        return [
            'amount' => round((float) $amount, 2),
            'currency' => strtoupper($currency),
        ];
    }

    // -----------------------------------------------------------------
    // Validation + low-level extraction
    // -----------------------------------------------------------------

    /**
     * @param array<string, mixed> $order
     * @param array<string, string> $receiver
     */
    private function assertReceiverComplete(array $order, array $receiver, ?string $countryRaw): void
    {
        $missing = [];
        foreach (['name', 'address', 'city', 'postalCode', 'countryCode'] as $required) {
            if (($receiver[$required] ?? '') === '') {
                $missing[] = $required;
            }
        }

        if ($missing === []) {
            return;
        }

        $ref = $this->orderReference($order);
        $hint = '';
        if (in_array('countryCode', $missing, true) && $countryRaw !== null && $countryRaw !== '') {
            $hint = " (country \"{$countryRaw}\" is not a recognized name or ISO code - extend DpdOrderMapper::COUNTRY_NAME_TO_ISO)";
        }

        throw new \RuntimeException(
            'Order ' . ($ref !== '' ? $ref : '?') . ' is missing required DPD receiver field(s): '
            . implode(', ', $missing) . $hint
            . '. Check the Customer/Addresses/Shipping block of the UNAS order (run with --dry-run to inspect it).'
        );
    }

    /**
     * @param array<string, mixed> $source
     * @param array<int, string> $keys
     */
    private function firstScalar(array $source, array $keys): ?string
    {
        foreach ($keys as $key) {
            if (!array_key_exists($key, $source)) {
                continue;
            }
            $value = $source[$key];
            if (is_scalar($value) && (string) $value !== '') {
                return (string) $value;
            }
            // SimpleXML "element with attributes + text" quirk: text at [0].
            if (is_array($value) && isset($value[0]) && is_scalar($value[0]) && (string) $value[0] !== '') {
                return (string) $value[0];
            }
        }

        return null;
    }

    private function normalizePostalCode(?string $value): string
    {
        if ($value === null) {
            return '';
        }

        // DPD expects the raw postcode; just collapse surrounding/inner
        // whitespace. Country-specific formatting (e.g. the PL "00-000"
        // dash) is left as the merchant entered it in UNAS.
        return trim(preg_replace('/\s+/', '', $value) ?? $value);
    }

    private function clean(?string $value): string
    {
        return $value === null ? '' : trim($value);
    }

    /**
     * @return array<string, mixed>
     */
    private function arr(mixed $value): array
    {
        return is_array($value) ? $value : [];
    }
}
