<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\App;
use App\Repositories\DpdShipmentRepository;

/**
 * End-to-end orchestration of "UNAS order -> DPD label PDF", shared by
 * the CLI script (scripts/generate_dpd_label.php) and the web controller
 * (DpdController) so there is exactly one implementation of the flow.
 *
 * It fetches the order fresh from UNAS, maps it (DpdOrderMapper),
 * registers the parcel(s) and renders the label (DpdApiService), writes
 * the PDF under storage/labels, and records the shipment
 * (DpdShipmentRepository) for idempotency and audit.
 */
final class DpdLabelGenerator
{
    /**
     * @param array<string, mixed> $senderConfig Sender block incl. 'fid'.
     * @param array{default_weight_kg?: float, cod_payment_methods?: array<int, string>, cod_currency?: string} $options
     */
    public function __construct(
        private readonly UnasApiService $unas,
        private readonly DpdApiService $dpd,
        private readonly DpdOrderMapper $mapper,
        private readonly DpdShipmentRepository $shipments,
        private readonly array $senderConfig,
        private readonly array $options,
        private readonly string $pageFormat,
        private readonly string $labelsDir
    ) {
    }

    /**
     * Builds a generator from the application config - the one place that
     * reads the 'dpd' / 'unas' / 'storage' config, so both entry points
     * wire the services up identically.
     */
    public static function fromConfig(): self
    {
        $unas = new UnasApiService(
            (string) App::config('unas.api_key'),
            (string) App::config('unas.base_url'),
            (int) App::config('unas.rate_limit_per_minute')
        );

        $wsdlOverride = (string) App::config('dpd.wsdl_url');
        $dpd = new DpdApiService(
            (string) App::config('dpd.login'),
            (string) App::config('dpd.password'),
            (string) App::config('dpd.master_fid'),
            (string) App::config('dpd.env'),
            $wsdlOverride !== '' ? $wsdlOverride : null,
            (int) App::config('dpd.rate_limit_per_minute')
        );

        $senderConfig = (array) App::config('dpd.sender', []);
        $senderConfig['fid'] = (string) App::config('dpd.sender_fid');

        $codMethods = array_values(array_filter(
            array_map(static fn (string $m): string => trim($m), explode(',', (string) App::config('dpd.cod_payment_methods', ''))),
            static fn (string $m): bool => $m !== ''
        ));

        return new self(
            $unas,
            $dpd,
            new DpdOrderMapper(),
            new DpdShipmentRepository(),
            $senderConfig,
            [
                'default_weight_kg' => (float) App::config('dpd.default_parcel_weight_kg', 1.0),
                'cod_payment_methods' => $codMethods,
                'cod_currency' => (string) App::config('dpd.cod_currency', 'PLN'),
            ],
            (string) App::config('dpd.label_page_format', 'A4'),
            (string) App::config('storage.labels_path', dirname(__DIR__, 2) . '/storage/labels')
        );
    }

    /**
     * Fetches the order and maps it, without calling DPD. Used by the
     * CLI --dry-run and to preview the payload.
     *
     * @return array{order: array<string,mixed>, package: array<string,mixed>, sessionType: string, hasCod: bool}
     */
    public function preview(string $orderId): array
    {
        $order = $this->fetchOrder($orderId);
        $package = $this->mapper->buildPackage($order, $this->senderConfig, $this->options);

        return [
            'order' => $order,
            'package' => $package,
            'sessionType' => $this->mapper->resolveSessionType($order, $this->senderConfig),
            'hasCod' => isset($package['packages'][0]['services']['cod']),
        ];
    }

    /**
     * The full live flow. On a non-forced order that already has a
     * 'created' shipment, returns that existing record untouched.
     *
     * @return array{
     *     status: string,
     *     already_existed: bool,
     *     waybills: array<int, string>,
     *     session_id: ?string,
     *     label_path: ?string,
     *     abs_path: ?string,
     *     pdf_bytes: int
     * }
     */
    public function generate(string $orderId, bool $force = false): array
    {
        $existing = $this->shipments->findByUnasOrderId($orderId);
        if (!$force && $existing !== null && ($existing['status'] ?? '') === 'created') {
            return [
                'status' => 'created',
                'already_existed' => true,
                'waybills' => $existing['waybills'] !== '' ? explode(',', (string) $existing['waybills']) : [],
                'session_id' => $existing['session_id'] ?? null,
                'label_path' => $existing['label_path'] ?? null,
                'abs_path' => $this->absPathFor((string) ($existing['label_path'] ?? '')),
                'pdf_bytes' => 0,
            ];
        }

        $senderFid = (string) ($this->senderConfig['fid'] ?? '');
        $order = $this->fetchOrder($orderId);
        $package = $this->mapper->buildPackage($order, $this->senderConfig, $this->options);
        $sessionType = $this->mapper->resolveSessionType($order, $this->senderConfig);

        // 1. register parcels
        try {
            $numbers = $this->dpd->generatePackageNumbers($package);
        } catch (\Throwable $e) {
            $this->recordFailure($orderId, $senderFid, null, [], $e->getMessage());
            throw $e;
        }

        $sessionId = $this->dpd->extractSessionId($numbers);
        $waybills = $this->dpd->extractWaybills($numbers);
        if ($sessionId === null || $waybills === []) {
            $status = $this->dpd->extractStatus($numbers);
            $validation = $this->dpd->extractValidationMessages($numbers);
            $detail = $validation !== [] ? ' - ' . implode('; ', $validation) : '';
            $message = 'DPD rejected the shipment (status=' . ($status ?? 'n/a') . ')' . $detail;
            $this->recordFailure($orderId, $senderFid, $sessionId, $waybills, $message);
            throw new \RuntimeException($message);
        }

        // 2. render label
        try {
            $labelResponse = $this->dpd->generateLabelsBySession($sessionId, $sessionType, $this->pageFormat);
            $pdf = $this->dpd->extractLabelPdf($labelResponse);
        } catch (\Throwable $e) {
            $this->recordFailure(
                $orderId,
                $senderFid,
                $sessionId,
                $waybills,
                'Parcels registered but label render failed: ' . $e->getMessage()
            );
            throw new \RuntimeException(
                'Label render failed after parcels were registered (waybills: ' . implode(', ', $waybills)
                . '). Re-render from sessionId ' . $sessionId . ' instead of re-registering. ' . $e->getMessage(),
                0,
                $e
            );
        }

        if ($pdf === null || $pdf === '') {
            $this->recordFailure($orderId, $senderFid, $sessionId, $waybills, 'Label response carried no documentData.');
            throw new \RuntimeException('DPD returned no label document (waybills registered: ' . implode(', ', $waybills) . ').');
        }

        // 3. save + record
        $relPath = $this->writePdf($orderId, $waybills[0], $pdf);
        $this->shipments->save([
            'unas_order_id' => $orderId,
            'session_id' => $sessionId,
            'waybills' => $waybills,
            'sender_fid' => $senderFid,
            'parcel_count' => count($waybills),
            'label_page_format' => $this->pageFormat,
            'label_path' => $relPath,
            'status' => 'created',
        ]);

        return [
            'status' => 'created',
            'already_existed' => false,
            'waybills' => $waybills,
            'session_id' => $sessionId,
            'label_path' => $relPath,
            'abs_path' => $this->absPathFor($relPath),
            'pdf_bytes' => strlen($pdf),
        ];
    }

    /**
     * @return array<string, mixed> One decoded UNAS <Order>.
     */
    private function fetchOrder(string $orderId): array
    {
        $response = $this->unas->getOrderDetails($orderId);
        $node = $response['Order'] ?? null;

        if (is_array($node) && !array_is_list($node)) {
            return $node;
        }
        if (is_array($node) && $node !== [] && is_array($node[0])) {
            return $node[0];
        }

        throw new \RuntimeException('UNAS returned no order for id ' . $orderId . ' - check the id and that the order exists.');
    }

    private function writePdf(string $orderId, string $waybill, string $pdf): string
    {
        if (!is_dir($this->labelsDir) && !mkdir($this->labelsDir, 0750, true) && !is_dir($this->labelsDir)) {
            throw new \RuntimeException('Could not create labels directory: ' . $this->labelsDir);
        }

        $safeOrderId = preg_replace('/[^A-Za-z0-9_-]/', '_', $orderId) ?? $orderId;
        $safeWaybill = preg_replace('/[^A-Za-z0-9_-]/', '_', $waybill) ?? $waybill;
        $fileName = 'dpd_' . $safeOrderId . '_' . $safeWaybill . '.pdf';
        $absPath = rtrim($this->labelsDir, '/') . '/' . $fileName;

        if (file_put_contents($absPath, $pdf) === false) {
            throw new \RuntimeException('Could not write the label PDF to ' . $absPath);
        }

        return 'storage/labels/' . $fileName;
    }

    private function absPathFor(string $relPath): ?string
    {
        if ($relPath === '') {
            return null;
        }

        return rtrim($this->labelsDir, '/') . '/' . basename($relPath);
    }

    /**
     * @param array<int, string> $waybills
     */
    private function recordFailure(string $orderId, string $senderFid, ?string $sessionId, array $waybills, string $message): void
    {
        $this->shipments->save([
            'unas_order_id' => $orderId,
            'session_id' => $sessionId,
            'waybills' => $waybills,
            'sender_fid' => $senderFid,
            'parcel_count' => count($waybills),
            'label_page_format' => $this->pageFormat,
            'status' => 'failed',
            'error_message' => $message,
        ]);
    }
}
