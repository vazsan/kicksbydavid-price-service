<?php
/** @var string $content */
/** @var string $title */
use App\Core\Auth;
$user = Auth::user();
$currentPath = '/' . trim((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/');
if ($currentPath === '/') {
    $currentPath = '/dashboard';
}
// Cache-busting: phones kept serving the old stylesheet after a deploy.
$asset = static function (string $path): string {
    $file = dirname(__DIR__, 2) . '/public' . $path;
    return $path . (is_file($file) ? '?v=' . filemtime($file) : '');
};
$navItems = [
    '/dashboard' => 'Dashboard',
    '/orders' => 'Orders',
    '/dpd' => 'DPD Labels',
    '/products' => 'Products',
    '/inventory' => 'Inventory',
    '/purchase-costs' => 'Purchase Costs',
    '/shipping-costs' => 'Shipping Costs',
    '/payment-fees' => 'Payment Fees',
    '/returns' => 'Returns',
    '/settings' => 'Settings',
    '/sync-logs' => 'Sync Logs',
    '/api-logs' => 'API Logs',
];
?>
<!doctype html>
<html lang="en">
<head><meta charset="utf-8">
    
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= e($title ?? 'Profit Analytics') ?> — Profit Analytics</title>
    <link rel="stylesheet" href="<?= e($asset('/assets/css/app.css')) ?>">
</head>
<body>
    <div class="app-shell">
        <aside class="sidebar">
            <div class="sidebar-top">
                <div class="sidebar-brand">Profit Analytics</div>
                <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="sidebar-menu">Menu</button>
            </div>
            <div class="sidebar-menu" id="sidebar-menu">
            <nav class="sidebar-nav">
                <?php foreach ($navItems as $href => $label): ?>
                    <a href="<?= e($href) ?>"<?= str_starts_with($currentPath, $href) ? ' class="active"' : '' ?>><?= e($label) ?></a>
                <?php endforeach; ?>
            </nav>
            <div class="sidebar-footer">
                <?php if ($user): ?>
                    <div class="sidebar-user"><?= e($user->name()) ?></div>
                    <form method="post" action="/logout">
                        <?= \App\Core\Csrf::field() ?>
                        <button type="submit" class="btn-link">Sign out</button>
                    </form>
                <?php endif; ?>
            </div>
            </div>
        </aside>
        <main class="main-content">
            <?= $content ?>
        </main>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
    <script src="<?= e($asset('/assets/js/app.js')) ?>"></script>
</body>
</html>
