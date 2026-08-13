<?php
/** @var string $content */
/** @var string $title */
use App\Core\Auth;
$user = Auth::user();
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= e($title ?? 'Profit Analytics') ?> — Profit Analytics</title>
    <link rel="stylesheet" href="/assets/css/app.css">
</head>
<body>
    <div class="app-shell">
        <aside class="sidebar">
            <div class="sidebar-brand">Profit Analytics</div>
            <nav class="sidebar-nav">
                <a href="/dashboard" class="active">Dashboard</a>
                <a href="/orders">Orders</a>
                <a href="/products">Products</a>
                <a href="/inventory">Inventory</a>
                <a href="/purchase-costs">Purchase Costs</a>
                <a href="/shipping-costs">Shipping Costs</a>
                <a href="/payment-fees">Payment Fees</a>
                <a href="/returns">Returns</a>
                <a href="/settings">Settings</a>
                <a href="/sync-logs">Sync Logs</a>
                <a href="/api-logs">API Logs</a>
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
        </aside>
        <main class="main-content">
            <?= $content ?>
        </main>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
    <script src="/assets/js/app.js"></script>
</body>
</html>
