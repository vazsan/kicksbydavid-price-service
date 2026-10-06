<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Logger;
use App\Helpers\RateLimiter;
use App\Repositories\ApiLogRepository;

/**
 * Client for the DPD Polska "DPDServices" SOAP web service - the service
 * that registers parcels (waybill numbers) and renders shipping labels
 * for an account. This is the one of the five DPD Polska services
 * (DPDServices, DPDAppServices, DPDInfoServices, DPDServicesDutyModule,
 * MyPudoApi) that produces labels; tracking (DPDInfoServices) and pickup
 * points (MyPudoApi) are separate services not implemented here.
 *
 * PROTOCOL (confirmed from DPD Polska's DPDServices business spec and two
 * independent PHP client libraries - coffeedesk/dpd-api-client-php and
 * msztorc/php-dpd-api - since the live WSDL is not reachable from the
 * dev sandbox this was written in; verify against the real signatures
 * with scripts/test_dpd_connection.php before the first live shipment):
 *
 *   - Transport: SOAP over the WSDL at
 *       production: https://dpdservices.dpd.com.pl/DPDPackageObjServicesService/DPDPackageObjServices?wsdl
 *       sandbox:    https://dpdservicesdemo.dpd.com.pl/DPDPackageObjServicesService/DPDPackageObjServices?wsdl
 *     Needs the PHP SOAP extension (ext-soap).
 *   - Auth: every operation carries an authData block
 *       { login, password, masterFID }
 *     There is no separate login/token step (unlike UNAS/Turum).
 *   - generatePackagesNumbersV4(openUMLFeV3, pkgNumsGenerationPolicyV1,
 *       langCode, authDataV1) -> registers parcels, returns a sessionId
 *       plus one waybill per parcel. openUMLFeV3 = { packages: [ {
 *       parcels:[{weight,content,...}], payerType, receiver:{...},
 *       sender:{fid,...}, services:{cod:{amount,currency}} } ] }.
 *   - generateSpedLabelsV4(dpdServicesParams, outputDocFormatV1,
 *       outputDocPageFormatV1, outputLabelTypeEnumV1, authDataV1) ->
 *       returns documentData: a base64-encoded label document (PDF here).
 *       dpdServicesParams = { policy, session:{ sessionType, sessionId } }.
 *
 * The exact WSDL part names (e.g. whether the output params carry a "V1"
 * suffix, whether generateSpedLabels needs a "variant" part) are the one
 * thing that can differ per account/WSDL version. The request keys below
 * are named in one place (buildPackageNumbersRequest / buildLabelsRequest)
 * precisely so they are trivial to line up against the authoritative
 * __getFunctions() dump that test_dpd_connection.php writes to disk.
 *
 * SAFETY: the password is never written to api_logs or to the SOAP trace
 * files - see call() and dumpTrace().
 */
final class DpdApiService
{
    private const PROVIDER = 'DPD';

    private const WSDL_PRODUCTION = 'https://dpdservices.dpd.com.pl/DPDPackageObjServicesService/DPDPackageObjServices?wsdl';
    private const WSDL_SANDBOX = 'https://dpdservicesdemo.dpd.com.pl/DPDPackageObjServicesService/DPDPackageObjServices?wsdl';

    private readonly string $wsdlUrl;
    private readonly RateLimiter $rateLimiter;
    private readonly ApiLogRepository $apiLog;

    private ?\SoapClient $client = null;

    public function __construct(
        private readonly string $login,
        private readonly string $password,
        private readonly string $masterFid,
        string $env = 'production',
        ?string $wsdlOverride = null,
        int $rateLimitPerMinute = 30,
        ?string $rateLimiterCacheFile = null,
        private readonly int $connectionTimeoutSeconds = 30
    ) {
        $this->wsdlUrl = ($wsdlOverride !== null && $wsdlOverride !== '')
            ? $wsdlOverride
            : ($env === 'sandbox' ? self::WSDL_SANDBOX : self::WSDL_PRODUCTION);

        $this->rateLimiter = new RateLimiter(
            $rateLimiterCacheFile ?? dirname(__DIR__, 2) . '/storage/cache/dpd_rate_limit.json',
            $rateLimitPerMinute
        );
        $this->apiLog = new ApiLogRepository();
    }

    public function wsdlUrl(): string
    {
        return $this->wsdlUrl;
    }

    // -----------------------------------------------------------------
    // SOAP client / introspection
    // -----------------------------------------------------------------

    /**
     * Lazily builds the SoapClient. The WSDL is fetched over the network
     * on first use, so this can throw (e.g. the host can't reach DPD, or
     * ext-soap is missing). Trace is on so a failed call's raw request /
     * response XML can be dumped for debugging.
     */
    private function client(): \SoapClient
    {
        if ($this->client !== null) {
            return $this->client;
        }

        if (!class_exists(\SoapClient::class)) {
            throw new \RuntimeException(
                'The PHP SOAP extension (ext-soap) is not enabled on this server; '
                . 'the DPD integration cannot work without it. Enable it in cPanel > Select PHP Version > Extensions.'
            );
        }

        if ($this->login === '' || $this->password === '' || $this->masterFid === '') {
            throw new \RuntimeException('DPD_LOGIN / DPD_PASSWORD / DPD_MASTER_FID are not configured. Set them in .env.');
        }

        try {
            $this->client = new \SoapClient($this->wsdlUrl, [
                'trace' => true,
                'exceptions' => true,
                'cache_wsdl' => WSDL_CACHE_DISK,
                'connection_timeout' => $this->connectionTimeoutSeconds,
                // Makes single repeated elements decode as 1-element arrays
                // so response parsing never has to special-case "one parcel".
                'features' => SOAP_SINGLE_ELEMENT_ARRAYS,
            ]);
        } catch (\Throwable $e) {
            throw new \RuntimeException("Could not load the DPD WSDL at {$this->wsdlUrl}: " . $e->getMessage(), 0, $e);
        }

        return $this->client;
    }

    /**
     * Introspection only - lists the operations the account's WSDL
     * exposes (and their exact signatures). Creates nothing. Used by the
     * connection diagnostic to confirm V4 is available and to read off
     * the authoritative parameter names.
     *
     * @return array<int, string>
     */
    public function listFunctions(): array
    {
        return $this->client()->__getFunctions();
    }

    /**
     * @return array<int, string>
     */
    public function listTypes(): array
    {
        return $this->client()->__getTypes();
    }

    // -----------------------------------------------------------------
    // Operations
    // -----------------------------------------------------------------

    /**
     * Registers parcels and returns DPD waybill numbers + a sessionId.
     *
     * @param array<string, mixed> $openUMLFe The openUMLFeV3 structure
     *     (see DpdOrderMapper::buildPackage()).
     * @return array<string, mixed> Normalized (array) SOAP response.
     */
    public function generatePackageNumbers(
        array $openUMLFe,
        string $policy = 'STOP_ON_FIRST_ERROR',
        // DPD Polska's DPDServices rejects 'EN' with UNSUPPORTED_LANG_CODE;
        // 'PL' is the value its account WSDL accepts.
        string $langCode = 'PL'
    ): array {
        return $this->call('generatePackagesNumbersV4', $this->buildPackageNumbersRequest($openUMLFe, $policy, $langCode));
    }

    /**
     * Renders the label(s) for a previously registered session.
     *
     * @param string $pageFormat 'A4' (laser) or 'LBL_PRINTER' (thermal).
     * @return array<string, mixed> Normalized SOAP response; the label
     *     bytes are in it under documentData (base64) - use extractLabelPdf().
     */
    public function generateLabelsBySession(
        int|string $sessionId,
        string $sessionType = 'DOMESTIC',
        string $pageFormat = 'A4'
    ): array {
        return $this->call('generateSpedLabelsV4', $this->buildLabelsRequest($sessionId, $sessionType, $pageFormat));
    }

    // -----------------------------------------------------------------
    // Request builders - the single place WSDL part names are spelled
    // out, so they are easy to reconcile against __getFunctions().
    // -----------------------------------------------------------------

    /**
     * @param array<string, mixed> $openUMLFe
     * @return array<string, mixed>
     */
    private function buildPackageNumbersRequest(array $openUMLFe, string $policy, string $langCode): array
    {
        return [
            'openUMLFeV3' => $openUMLFe,
            'pkgNumsGenerationPolicyV1' => $policy,
            'langCode' => $langCode,
            'authDataV1' => $this->authData(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildLabelsRequest(int|string $sessionId, string $sessionType, string $pageFormat): array
    {
        // Field names confirmed from the live WSDL type generateSpedLabelsV4:
        // dpdServicesParamsV1, outputDocFormatV1, outputDocPageFormatV1,
        // outputLabelType (no "EnumV1" suffix), labelVariant, authDataV1.
        return [
            'dpdServicesParamsV1' => [
                'policy' => 'STOP_ON_FIRST_ERROR',
                'session' => [
                    'sessionId' => (int) $sessionId,
                    'sessionType' => $sessionType,
                ],
            ],
            'outputDocFormatV1' => 'PDF',
            'outputDocPageFormatV1' => $pageFormat,
            'outputLabelType' => 'BIC3',
            'labelVariant' => '',
            'authDataV1' => $this->authData(),
        ];
    }

    /**
     * @return array{login: string, password: string, masterFID: string}
     */
    private function authData(): array
    {
        return [
            'login' => $this->login,
            'password' => $this->password,
            'masterFID' => $this->masterFid,
        ];
    }

    // -----------------------------------------------------------------
    // Response extraction helpers (SOAP shape -> plain values)
    // -----------------------------------------------------------------

    /**
     * Pulls the sessionId out of a generatePackageNumbers response,
     * tolerating the "return" wrapper SOAP responses often carry.
     *
     * @param array<string, mixed> $response
     */
    public function extractSessionId(array $response): ?string
    {
        $root = $this->unwrapReturn($response);
        $sessionId = $root['sessionId'] ?? ($root['SessionId'] ?? null);

        return is_scalar($sessionId) && (string) $sessionId !== '' ? (string) $sessionId : null;
    }

    /**
     * Collects every parcel waybill number from a generatePackageNumbers
     * response. The live DPD Polska shape is PascalCase and doubly nested:
     * return.Packages.Package[].Parcels.Parcel[].Waybill.
     *
     * @param array<string, mixed> $response
     * @return array<int, string>
     */
    public function extractWaybills(array $response): array
    {
        $root = $this->unwrapReturn($response);
        $waybills = [];

        foreach ($this->childList($root, ['Packages', 'packages'], ['Package', 'package']) as $package) {
            if (!is_array($package)) {
                continue;
            }
            foreach ($this->childList($package, ['Parcels', 'parcels'], ['Parcel', 'parcel']) as $parcel) {
                if (!is_array($parcel)) {
                    continue;
                }
                $waybill = $parcel['Waybill'] ?? ($parcel['waybill'] ?? null);
                if (is_scalar($waybill) && (string) $waybill !== '') {
                    $waybills[] = (string) $waybill;
                }
            }
        }

        return $waybills;
    }

    /**
     * Resolves a SOAP "wrapper -> repeated item" shape (e.g. Packages ->
     * Package[]) into a plain list, tolerating case and the one-vs-many
     * collapsing. Checks each wrapper key, then each item key inside it;
     * if no item key matches, the wrapper itself is treated as the list.
     *
     * @param array<string, mixed> $node
     * @param array<int, string> $wrapperKeys
     * @param array<int, string> $itemKeys
     * @return array<int, mixed>
     */
    private function childList(array $node, array $wrapperKeys, array $itemKeys): array
    {
        $wrapper = null;
        foreach ($wrapperKeys as $wk) {
            if (isset($node[$wk]) && is_array($node[$wk])) {
                $wrapper = $node[$wk];
                break;
            }
        }
        if ($wrapper === null) {
            return [];
        }

        foreach ($itemKeys as $ik) {
            if (isset($wrapper[$ik])) {
                return $this->asList($wrapper[$ik]);
            }
        }

        return $this->asList($wrapper);
    }

    /**
     * Returns the decoded label PDF bytes from a generateSpedLabels
     * response, or null if the response carried no documentData.
     *
     * @param array<string, mixed> $response
     */
    public function extractLabelPdf(array $response): ?string
    {
        // The label bytes live in documentGenerationResponseV1.documentData,
        // but casing/nesting varies, so search the response tree for the
        // document-data field by name.
        $data = $this->deepFindDocumentData($response);

        if (!is_string($data) || $data === '') {
            return null;
        }

        $decoded = base64_decode($data, true);

        // Some WSDL type maps already hand back decoded bytes; if base64
        // decoding fails, assume the string is the raw document already.
        return $decoded === false ? $data : $decoded;
    }

    /**
     * Recursively finds the first value under a key that names the label
     * document (documentData / fileData / fileContent), in any casing and
     * at any depth.
     *
     * @param array<string, mixed> $node
     */
    private function deepFindDocumentData(array $node): ?string
    {
        foreach ($node as $key => $value) {
            if (is_string($key)
                && preg_match('/document.?data|file.?data|file.?content/i', $key) === 1
                && is_string($value) && $value !== ''
            ) {
                return $value;
            }
        }

        foreach ($node as $value) {
            if (is_array($value)) {
                $found = $this->deepFindDocumentData($value);
                if ($found !== null) {
                    return $found;
                }
            }
        }

        return null;
    }

    /**
     * Reads the overall status string DPD returns ("OK" on success),
     * useful for surfacing a business-level failure that still came back
     * as a 200/no-SoapFault.
     *
     * @param array<string, mixed> $response
     */
    public function extractStatus(array $response): ?string
    {
        $root = $this->unwrapReturn($response);
        $status = $root['status'] ?? ($root['Status'] ?? null);

        return is_scalar($status) ? (string) $status : null;
    }

    // -----------------------------------------------------------------
    // Low-level call pipeline
    // -----------------------------------------------------------------

    /**
     * @param array<string, mixed> $args A single structured argument;
     *     SoapClient maps its keys onto the operation's request wrapper.
     * @return array<string, mixed>
     */
    private function call(string $operation, array $args): array
    {
        $this->rateLimiter->throttle();

        $client = $this->client();
        $startedAt = new \DateTimeImmutable();
        $startMicro = microtime(true);
        $errorMessage = null;
        $result = null;

        try {
            $result = $client->__soapCall($operation, [$args]);
        } catch (\SoapFault $f) {
            $errorMessage = 'SOAP fault: ' . $f->getMessage();
        } catch (\Throwable $e) {
            $errorMessage = $e->getMessage();
        }

        $durationMs = (int) round((microtime(true) - $startMicro) * 1000);
        $isSuccess = $errorMessage === null;

        // No HTTP status for SOAP; endpoint column holds the operation name.
        $this->apiLog->log(self::PROVIDER, $operation, 'SOAP', $startedAt, null, $isSuccess, $durationMs, $errorMessage);

        if (!$isSuccess) {
            $this->dumpTrace($operation, $client);
            Logger::error('dpd_api', "SOAP {$operation} failed", ['error' => $errorMessage]);
            throw new \RuntimeException("DPD SOAP {$operation} failed: {$errorMessage}");
        }

        return $this->normalize($result);
    }

    /**
     * Converts SoapClient's nested stdClass graph into plain arrays so
     * callers have one predictable shape to read.
     *
     * @return array<string, mixed>
     */
    private function normalize(mixed $result): array
    {
        $encoded = json_encode($result);
        if ($encoded === false) {
            return [];
        }

        $decoded = json_decode($encoded, true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * SOAP responses commonly wrap the payload in a "return" element.
     * This returns that inner node when present, else the node as-is.
     *
     * @param array<string, mixed> $response
     * @return array<string, mixed>
     */
    private function unwrapReturn(array $response): array
    {
        if (isset($response['return']) && is_array($response['return'])) {
            return $response['return'];
        }

        return $response;
    }

    /**
     * Normalizes a possibly-single, possibly-list SOAP child into a list.
     *
     * @return array<int, mixed>
     */
    private function asList(mixed $value): array
    {
        if ($value === null || !is_array($value)) {
            return [];
        }

        return array_is_list($value) ? $value : [$value];
    }

    /**
     * Writes the last SOAP request/response XML to storage/logs for
     * debugging a failure - with the <password> element masked so the
     * credential never lands on disk.
     */
    private function dumpTrace(string $operation, \SoapClient $client): void
    {
        $dir = dirname(__DIR__, 2) . '/storage/logs';
        if (!is_dir($dir) && !@mkdir($dir, 0750, true) && !is_dir($dir)) {
            return;
        }

        $request = (string) ($client->__getLastRequest() ?? '');
        $response = (string) ($client->__getLastResponse() ?? '');

        $request = $this->maskPassword($request);

        $payload = "=== {$operation} REQUEST (password masked) ===\n{$request}\n\n=== RESPONSE ===\n{$response}\n";
        @file_put_contents($dir . '/dpd_soap_last.xml', $payload);
    }

    private function maskPassword(string $xml): string
    {
        // Mask <...:password>...</...:password> regardless of namespace prefix.
        $masked = preg_replace('/(<([A-Za-z0-9]+:)?password>).*?(<\/([A-Za-z0-9]+:)?password>)/is', '$1[MASKED]$3', $xml);

        return $masked ?? $xml;
    }
}
