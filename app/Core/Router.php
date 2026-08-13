<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Minimal request router.
 *
 * On purpose this is not a full framework router: no route groups, no
 * middleware pipeline, no regex route params yet. Routes are matched by
 * exact path plus a leading ":param" segment convention (e.g. "/orders/:id").
 * public/.htaccess rewrites every request to index.php?route=<path>, so
 * routing works the same whether the vhost docroot is "public/" directly
 * or reached through a subdirectory.
 */
final class Router
{
    /** @var array<string, array<string, array{0: class-string, 1: string}>> */
    private array $routes = [
        'GET' => [],
        'POST' => [],
    ];

    public function get(string $path, array $handler): void
    {
        $this->routes['GET'][$this->normalize($path)] = $handler;
    }

    public function post(string $path, array $handler): void
    {
        $this->routes['POST'][$this->normalize($path)] = $handler;
    }

    public function dispatch(string $method, string $path): void
    {
        $method = strtoupper($method);
        $path = $this->normalize($path);

        foreach ($this->routes[$method] ?? [] as $pattern => $handler) {
            $params = $this->match($pattern, $path);
            if ($params !== null) {
                $this->invoke($handler, $params);
                return;
            }
        }

        http_response_code(404);
        require dirname(__DIR__, 2) . '/views/errors/404.php';
    }

    /**
     * @return array<string, string>|null
     */
    private function match(string $pattern, string $path): ?array
    {
        $patternParts = explode('/', trim($pattern, '/'));
        $pathParts = explode('/', trim($path, '/'));

        if (count($patternParts) !== count($pathParts)) {
            return null;
        }

        $params = [];
        foreach ($patternParts as $i => $part) {
            if (str_starts_with($part, ':')) {
                $params[substr($part, 1)] = $pathParts[$i];
                continue;
            }
            if ($part !== $pathParts[$i]) {
                return null;
            }
        }

        return $params;
    }

    /**
     * @param array{0: class-string, 1: string} $handler
     * @param array<string, string> $params
     */
    private function invoke(array $handler, array $params): void
    {
        [$class, $method] = $handler;
        $controller = new $class();
        $controller->$method($params);
    }

    private function normalize(string $path): string
    {
        $path = '/' . trim(parse_url($path, PHP_URL_PATH) ?: '', '/');
        return $path === '/' ? '/' : rtrim($path, '/');
    }
}
