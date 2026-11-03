<?php
/** @var array<int, array<string, mixed>> $shipments */
/** @var bool $configOk */
/** @var ?string $flashSuccess */
/** @var ?string $flashError */
?>
<div class="page-header">
    <h1>DPD Labels</h1>
</div>

<?php if ($flashSuccess !== null): ?>
    <div class="alert alert-success"><?= e($flashSuccess) ?></div>
<?php endif; ?>
<?php if ($flashError !== null): ?>
    <div class="alert alert-error"><?= e($flashError) ?></div>
<?php endif; ?>

<?php if (!$configOk): ?>
    <div class="alert alert-info">
        DPD is not fully configured yet. Fill in the <code>DPD_*</code> values in
        <code>.env</code> (login, password, masterFID, sender FID and the sender
        address), and make sure the PHP <code>soap</code> extension is enabled.
        See <code>DPD.md</code> for the full setup.
    </div>
<?php endif; ?>

<section class="card">
    <h2>Generate a label</h2>
    <p class="muted">
        Enter the UNAS order id. The recipient address is fetched live from UNAS,
        a DPD waybill is registered and an <?= e(strtoupper((string) \App\Core\App::config('dpd.label_page_format', 'A4'))) ?>
        PDF label is produced for download.
    </p>
    <form method="post" action="/dpd/generate" class="dpd-form">
        <?= \App\Core\Csrf::field() ?>
        <input type="text" name="order_id" placeholder="UNAS order id, e.g. 123456" required
               autocomplete="off" inputmode="numeric">
        <label class="checkbox">
            <input type="checkbox" name="force" value="1">
            Force (register a new waybill even if one already exists)
        </label>
        <button type="submit" class="btn btn-primary" <?= $configOk ? '' : 'disabled' ?>>Generate label</button>
    </form>
</section>

<?php
$tracked = array_values(array_filter(
    $shipments,
    static fn (array $s): bool => ($s['status'] ?? '') === 'created' && trim((string) ($s['waybills'] ?? '')) !== ''
));
$tracked = array_slice($tracked, 0, 20);
?>
<?php if ($tracked !== []): ?>
<section class="card">
    <div class="trk-head">
        <h2>Csomagkövetés</h2>
        <span class="muted small" id="trk-updated">Élő DPD-adat</span>
    </div>
    <div class="trk-list">
        <?php foreach ($tracked as $s): ?>
            <?php foreach (array_filter(array_map('trim', explode(',', (string) $s['waybills']))) as $wb): ?>
                <div class="trk-card" data-waybill="<?= e($wb) ?>">
                    <button type="button" class="trk-summary" aria-expanded="false">
                        <span class="trk-main">
                            <span class="trk-waybill"><?= e($wb) ?></span>
                            <span class="trk-bar" aria-hidden="true">
                                <span></span><span></span><span></span><span></span><span></span>
                            </span>
                            <span class="trk-status">Betöltés...</span>
                            <span class="trk-meta">Rendelés <?= e($s['unas_order_id'] ?? '') ?></span>
                        </span>
                        <span class="trk-chevron" aria-hidden="true">&#8250;</span>
                    </button>
                    <ol class="trk-events" hidden></ol>
                </div>
            <?php endforeach; ?>
        <?php endforeach; ?>
    </div>
</section>
<?php endif; ?>

<section class="card">
    <h2>Recent labels</h2>
    <?php if ($shipments === []): ?>
        <p class="muted">No labels generated yet.</p>
    <?php else: ?>
        <table class="data-table data-table-stack">
            <thead>
                <tr>
                    <th>Order</th>
                    <th>Waybill(s)</th>
                    <th>Parcels</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($shipments as $s): ?>
                    <?php $status = (string) ($s['status'] ?? ''); ?>
                    <tr>
                        <td data-label="Order"><?= e($s['unas_order_id'] ?? '') ?></td>
                        <td data-label="Waybill(s)"><?= e($s['waybills'] ?? '') ?: '—' ?></td>
                        <td data-label="Parcels"><?= (int) ($s['parcel_count'] ?? 0) ?></td>
                        <td data-label="Status">
                            <span class="badge badge-<?= $status === 'created' ? 'ok' : 'error' ?>">
                                <?= e($status !== '' ? $status : 'unknown') ?>
                            </span>
                            <?php if ($status !== 'created' && ($s['error_message'] ?? '') !== ''): ?>
                                <div class="muted small" title="<?= e($s['error_message']) ?>">
                                    <?= e(mb_strimwidth((string) $s['error_message'], 0, 90, '…')) ?>
                                </div>
                            <?php endif; ?>
                        </td>
                        <td data-label="Created"><?= e($s['created_at'] ?? '') ?></td>
                        <td class="cell-action">
                            <?php if ($status === 'created' && ($s['label_path'] ?? '') !== ''): ?>
                                <a class="btn btn-secondary btn-small"
                                   href="/dpd/label/<?= e(rawurlencode((string) $s['unas_order_id'])) ?>">
                                    Download PDF
                                </a>
                            <?php else: ?>
                                <span class="no-action">—</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</section>

<?php $trkJs = dirname(__DIR__, 2) . '/public/assets/js/dpd-tracking.js'; ?>
<script src="/assets/js/dpd-tracking.js<?= is_file($trkJs) ? '?v=' . filemtime($trkJs) : '' ?>"></script>
