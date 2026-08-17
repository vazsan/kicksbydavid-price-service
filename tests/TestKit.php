<?php

declare(strict_types=1);

/**
 * Minimal, dependency-free test helper - this project deliberately has no
 * Composer/PHPUnit (see ARCHITECTURE.md "Why no framework, why no
 * Composer"), so tests are plain PHP scripts using this instead. Not a
 * general-purpose test framework - just enough to assert and report.
 */
final class TestKit
{
    private int $passed = 0;
    private int $failed = 0;
    private string $suiteName;

    public function __construct(string $suiteName)
    {
        $this->suiteName = $suiteName;
        fwrite(STDOUT, "=== {$suiteName} ===" . PHP_EOL);
    }

    public function assertSame(mixed $expected, mixed $actual, string $description): void
    {
        if ($expected === $actual) {
            $this->pass($description);
            return;
        }

        $this->fail($description, 'expected ' . $this->describe($expected) . ', got ' . $this->describe($actual));
    }

    public function assertTrue(bool $condition, string $description): void
    {
        $condition ? $this->pass($description) : $this->fail($description, 'expected true, got false');
    }

    public function assertNull(mixed $value, string $description): void
    {
        $value === null ? $this->pass($description) : $this->fail($description, 'expected null, got ' . $this->describe($value));
    }

    public function assertThrows(callable $fn, string $description): void
    {
        try {
            $fn();
            $this->fail($description, 'expected an exception, none was thrown');
        } catch (\Throwable) {
            $this->pass($description);
        }
    }

    private function pass(string $description): void
    {
        $this->passed++;
        fwrite(STDOUT, "  [PASS] {$description}" . PHP_EOL);
    }

    private function fail(string $description, string $detail): void
    {
        $this->failed++;
        fwrite(STDOUT, "  [FAIL] {$description} - {$detail}" . PHP_EOL);
    }

    private function describe(mixed $value): string
    {
        if (is_string($value)) {
            return "'{$value}'";
        }

        return is_scalar($value) || $value === null ? var_export($value, true) : json_encode($value);
    }

    /** Returns true if the whole suite passed - use as the process exit code source. */
    public function summary(): bool
    {
        fwrite(STDOUT, "--- {$this->suiteName}: {$this->passed} passed, {$this->failed} failed ---" . PHP_EOL . PHP_EOL);

        return $this->failed === 0;
    }
}
