<?php

declare(strict_types=1);

/**
 * Runs every *Test.php script in this directory in its own process (so
 * one test file's fatal error can't take down the rest) and reports a
 * combined pass/fail. No PHPUnit/Composer - see TestKit.php.
 *
 * Usage: php tests/run_all.php
 */

$testFiles = glob(__DIR__ . '/*Test.php');
sort($testFiles);

if ($testFiles === [] || $testFiles === false) {
    fwrite(STDERR, "No test files found in " . __DIR__ . PHP_EOL);
    exit(1);
}

$phpBinary = PHP_BINARY;
$failedSuites = [];

foreach ($testFiles as $file) {
    $output = [];
    $exitCode = 0;
    exec(escapeshellarg($phpBinary) . ' ' . escapeshellarg($file), $output, $exitCode);

    fwrite(STDOUT, implode(PHP_EOL, $output) . PHP_EOL);

    if ($exitCode !== 0) {
        $failedSuites[] = basename($file);
    }
}

if ($failedSuites !== []) {
    fwrite(STDOUT, 'FAILED SUITES: ' . implode(', ', $failedSuites) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, 'All test suites passed.' . PHP_EOL);
exit(0);
