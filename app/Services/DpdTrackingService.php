<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\App;

/**
 * Live parcel tracking through DPD Polska's DPDInfoServices SOAP service
 * (getEventsForWaybillV1). Same login/password as the label service;
 * authDataV1 here is { login, password, channel } with an empty channel.
 *
 * Measured on 2026-11-03 against our real waybills: the service returns
 * the whole journey, including the foreign (SK) leg after "Sent outside
 * Poland" (business codes 5xxxxx), newest event first.
 *
 * Results are cached per waybill for a few minutes so a page with many
 * parcels does not hit DPD on every refresh.
 */
final class DpdTrackingService
{
    private const WSDL = 'https://dpdinfoservices.dpd.com.pl/DPDInfoServicesObjEventsService/DPDInfoServicesObjEvents?wsdl';
    private const CACHE_TTL_SECONDS = 180;

    /**
     * Business code => [stage 1-5, Hungarian label, tone].
     * Stages follow the DPD app: 1 registered, 2 in transit, 3 in the
     * destination depot, 4 out for delivery / at pickup point, 5 delivered.
     * A null stage means "problem": keep the stage reached so far.
     */
    private const CODES = [
        '030103' => [1, 'Adatok rögzítve, feladásra vár', 'progress'],
        '040101' => [2, 'A futár felvette', 'progress'],
        '330135' => [2, 'DPD depóban (Lengyelország)', 'progress'],
        '330137' => [2, 'DPD depóban (Lengyelország)', 'progress'],
        '230405' => [2, 'Úton, elhagyta Lengyelországot', 'progress'],
        '500100' => [3, 'Megérkezett a célország DPD depójába', 'progress'],
        '500200' => [3, 'A kézbesítő depóban', 'progress'],
        '500300' => [4, 'Kiszállítás alatt', 'progress'],
        '502300' => [4, 'Átvehető a csomagponton', 'progress'],
        '511201' => [4, 'Átvehető a csomagponton', 'progress'],
        '501300' => [5, 'Kézbesítve', 'done'],
        '511901' => [5, 'Kézbesítve (átvette a csomagponton)', 'done'],
        '511801' => [null, 'A futár elvitte a csomagpontról', 'problem'],
        '500400' => [null, 'Sikertelen kézbesítési kísérlet', 'problem'],
        '500600' => [null, 'Átirányítva másik depóba', 'problem'],
        '500015' => [null, 'Nem kézbesíthető: a címzett megtagadta', 'problem'],
        '500615' => [null, 'Visszaküldés a feladónak', 'problem'],
        '230408' => [null, 'Visszaküldve a feladónak (export visszáru)', 'problem'],
    ];

    private ?\SoapClient $client = null;

    public function __construct(
        private readonly string $login,
        private readonly string $password,
        private readonly string $cacheDir
    ) {
    }

    public static function fromConfig(): self
    {
        return new self(
            (string) App::config('dpd.login', ''),
            (string) App::config('dpd.password', ''),
            rtrim((string) App::config('storage.cache_path', dirname(__DIR__, 2) . '/storage/cache'), '/') . '/dpd_tracking'
        );
    }

    /**
     * Tracking summary for one waybill: stage, label, tone and the
     * event timeline (newest first), ready to hand to the browser.
     *
     * @return array{waybill: string, stage: int, label: string, tone: string, updated: string, events: array<int, array<string, string>>, fetched_at: int}
     */
    public function track(string $waybill): array
    {
        $cached = $this->readCache($waybill);
        if ($cached !== null) {
            return $cached;
        }

        $events = $this->fetchEvents($waybill);
        $summary = $this->summarize($waybill, $events);
        $this->writeCache($waybill, $summary);

        return $summary;
    }

    /**
     * @return array<int, array<string, string>> Newest first.
     */
    private function fetchEvents(string $waybill): array
    {
        $response = $this->client()->getEventsForWaybillV1([
            'waybill' => $waybill,
            'eventsSelectType' => 'ALL',
            'language' => 'EN',
            'authDataV1' => ['login' => $this->login, 'password' => $this->password, 'channel' => ''],
        ]);

        $list = $response->return->eventsList ?? [];
        $events = [];
        foreach ((array) $list as $e) {
            $events[] = [
                'time' => (string) ($e->eventTime ?? ''),
                'code' => (string) ($e->businessCode ?? ''),
                'description' => (string) ($e->description ?? ''),
                'country' => (string) ($e->country ?? ''),
                'depot' => (string) ($e->depotName ?? ''),
            ];
        }

        usort($events, static fn (array $a, array $b): int => strcmp($b['time'], $a['time']));

        return $events;
    }

    /**
     * @param array<int, array<string, string>> $events Newest first.
     */
    private function summarize(string $waybill, array $events): array
    {
        $stage = 0;
        foreach ($events as $e) {
            $s = self::CODES[$e['code']][0] ?? null;
            if ($s !== null && $s > $stage) {
                $stage = $s;
            }
        }

        $label = 'Még nincs DPD-esemény';
        $tone = 'progress';
        $updated = '';
        foreach ($events as $e) {
            if (isset(self::CODES[$e['code']])) {
                [, $label, $tone] = self::CODES[$e['code']];
                $updated = $e['time'];
                break;
            }
        }
        if ($updated === '' && $events !== []) {
            $label = $events[0]['description'];
            $updated = $events[0]['time'];
        }

        $timeline = [];
        foreach ($events as $e) {
            $place = trim($e['depot'] . ($e['country'] !== '' ? ' (' . $e['country'] . ')' : ''));
            $timeline[] = [
                'time' => $e['time'],
                'label' => self::CODES[$e['code']][1] ?? $e['description'],
                'tone' => self::CODES[$e['code']][2] ?? 'progress',
                'place' => $place,
            ];
        }

        return [
            'waybill' => $waybill,
            'stage' => $stage,
            'label' => $label,
            'tone' => $tone,
            'updated' => $updated,
            'events' => $timeline,
            'fetched_at' => time(),
        ];
    }

    private function client(): \SoapClient
    {
        if ($this->client !== null) {
            return $this->client;
        }
        if (!class_exists(\SoapClient::class)) {
            throw new \RuntimeException('The PHP SOAP extension is not enabled on this server.');
        }
        if ($this->login === '' || $this->password === '') {
            throw new \RuntimeException('DPD_LOGIN / DPD_PASSWORD are not configured.');
        }

        $this->client = new \SoapClient(self::WSDL, [
            'exceptions' => true,
            'cache_wsdl' => WSDL_CACHE_DISK,
            'connection_timeout' => 20,
            'features' => SOAP_SINGLE_ELEMENT_ARRAYS,
        ]);

        return $this->client;
    }

    private function cacheFile(string $waybill): string
    {
        return $this->cacheDir . '/' . preg_replace('/[^0-9A-Za-z]/', '', $waybill) . '.json';
    }

    private function readCache(string $waybill): ?array
    {
        $file = $this->cacheFile($waybill);
        if (!is_file($file) || filemtime($file) < time() - self::CACHE_TTL_SECONDS) {
            return null;
        }
        $data = json_decode((string) file_get_contents($file), true);

        return is_array($data) ? $data : null;
    }

    private function writeCache(string $waybill, array $summary): void
    {
        if (!is_dir($this->cacheDir)) {
            @mkdir($this->cacheDir, 0775, true);
        }
        @file_put_contents($this->cacheFile($waybill), json_encode($summary, JSON_UNESCAPED_UNICODE), LOCK_EX);
    }
}
