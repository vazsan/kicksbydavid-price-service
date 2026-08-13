<?php
/** @var string|null $error */
use App\Core\Csrf;
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Sign in — Profit Analytics</title>
    <link rel="stylesheet" href="/assets/css/app.css">
</head>
<body class="auth-page">
    <main class="auth-card">
        <h1>Profit Analytics</h1>
        <p class="auth-subtitle">Sign in to the admin panel</p>

        <?php if ($error): ?>
            <div class="alert alert-error"><?= e($error) ?></div>
        <?php endif; ?>

        <form method="post" action="/login" class="auth-form" autocomplete="off">
            <?= Csrf::field() ?>

            <label for="email">Email</label>
            <input type="email" id="email" name="email" value="<?= old('email') ?>" required autofocus>

            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>

            <button type="submit" class="btn btn-primary">Sign in</button>
        </form>
    </main>
</body>
</html>
