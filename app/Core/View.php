<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Tiny PHP-template renderer (no template language of its own - plain PHP
 * views with e()/render() helpers). Views live in /views, always outside
 * the webroot so they can only ever be reached through a controller.
 */
final class View
{
    private static string $viewsPath = __DIR__ . '/../../views';

    public static function render(string $view, array $data = []): void
    {
        $file = self::$viewsPath . '/' . str_replace('.', '/', $view) . '.php';

        if (!is_file($file)) {
            throw new \RuntimeException("View not found: {$view}");
        }

        extract($data, EXTR_SKIP);
        require $file;
    }

    /**
     * Render a view into a layout. The layout file receives $content
     * (the rendered inner view) plus whatever $data was passed.
     */
    public static function renderWithLayout(string $view, array $data = [], string $layout = 'layouts.main'): void
    {
        ob_start();
        self::render($view, $data);
        $content = ob_get_clean();

        self::render($layout, array_merge($data, ['content' => $content]));
    }
}
