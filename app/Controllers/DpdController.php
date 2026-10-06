<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\App;
use App\Core\Auth;
use App\Core\Csrf;
use App\Core\Logger;
use App\Core\View;
use App\Repositories\DpdShipmentRepository;
use App\Services\DpdLabelGenerator;

/**
 * Web UI for generating DPD Polska shipping labels from UNAS orders.
 * Type a UNAS order id, click generate, download the PDF - no shell
 * access needed. Backed by the same DpdLabelGenerator the CLI uses.
 */
final class DpdController
{
    public function index(): void
    {
        Auth::requireLogin();

        $shipments = new DpdShipmentRepository();

        View::renderWithLayout('dpd.index', [
            'title' => 'DPD Labels',
            'shipments' => $shipments->recent(50),
            'configOk' => $this->configOk(),
            'flashSuccess' => $this->takeFlash('_flash_success'),
            'flashError' => $this->takeFlash('_flash_error'),
        ]);
    }

    public function generate(): void
    {
        Auth::requireLogin();

        if (!Csrf::verify($_POST['_csrf'] ?? null)) {
            $_SESSION['_flash_error'] = 'Invalid or expired form submission. Please try again.';
            $this->redirectToIndex();
        }

        $orderId = trim((string) ($_POST['order_id'] ?? ''));
        $force = ($_POST['force'] ?? '') === '1';

        if ($orderId === '') {
            $_SESSION['_flash_error'] = 'Please enter a UNAS order id.';
            $this->redirectToIndex();
        }

        if (!$this->configOk()) {
            $_SESSION['_flash_error'] = 'DPD is not fully configured yet. Set the DPD_* values in .env first.';
            $this->redirectToIndex();
        }

        // Label generation makes several external calls (UNAS + two SOAP
        // calls); give it room beyond the default web timeout.
        if (function_exists('set_time_limit')) {
            @set_time_limit(120);
        }

        try {
            $result = DpdLabelGenerator::fromConfig()->generate($orderId, $force);
        } catch (\Throwable $e) {
            Logger::error('dpd_web', 'Label generation failed', ['order_id' => $orderId, 'error' => $e->getMessage()]);
            $_SESSION['_flash_error'] = 'Order ' . $orderId . ': ' . $e->getMessage();
            $this->redirectToIndex();
        }

        $waybills = implode(', ', $result['waybills']);
        $_SESSION['_flash_success'] = $result['already_existed']
            ? 'Order ' . $orderId . ' already had a label (waybill ' . $waybills . '). Use "force" to make a new one.'
            : 'Label generated for order ' . $orderId . ' - waybill ' . $waybills . '.';

        $this->redirectToIndex();
    }

    /**
     * Streams the stored label PDF for an order as a download.
     *
     * @param array<string, string> $params Router params; 'orderId' here.
     */
    public function download(array $params = []): void
    {
        Auth::requireLogin();

        $orderId = (string) ($params['orderId'] ?? '');
        $shipments = new DpdShipmentRepository();
        $row = $orderId !== '' ? $shipments->findByUnasOrderId($orderId) : null;

        $relPath = is_array($row) ? (string) ($row['label_path'] ?? '') : '';
        if ($relPath === '') {
            http_response_code(404);
            require dirname(__DIR__, 2) . '/views/errors/404.php';
            return;
        }

        // Resolve to the labels dir + basename only, so a tampered
        // label_path can never escape storage/labels.
        $labelsDir = (string) App::config('storage.labels_path', dirname(__DIR__, 2) . '/storage/labels');
        $absPath = rtrim($labelsDir, '/') . '/' . basename($relPath);

        if (!is_file($absPath)) {
            http_response_code(404);
            require dirname(__DIR__, 2) . '/views/errors/404.php';
            return;
        }

        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . basename($absPath) . '"');
        header('Content-Length: ' . (string) filesize($absPath));
        header('X-Content-Type-Options: nosniff');
        readfile($absPath);
        exit;
    }

    private function configOk(): bool
    {
        foreach (['dpd.login', 'dpd.password', 'dpd.master_fid', 'dpd.sender_fid'] as $key) {
            if ((string) App::config($key, '') === '') {
                return false;
            }
        }

        return extension_loaded('soap');
    }

    private function takeFlash(string $key): ?string
    {
        $value = $_SESSION[$key] ?? null;
        unset($_SESSION[$key]);

        return is_string($value) ? $value : null;
    }

    private function redirectToIndex(): never
    {
        header('Location: /dpd');
        exit;
    }
}
