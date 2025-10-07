import { performance } from 'node:perf_hooks';
import { createLogger, resetLoggerInitialization } from '../src/createLogger.js';

// Simple benchmark runner
async function runBenchmark() {
  const iterations = 100000;
  const results: Record<string, number> = {};

  console.log('🚀 Logger Performance Benchmark\n');
  console.log(`Running ${iterations.toLocaleString()} operations per test...\n`);

  // Test 1: Logger creation with default format
  resetLoggerInitialization();
  delete process.env.UNCHAINED_LOG_FORMAT;

  let start = performance.now();
  for (let i = 0; i < iterations / 100; i++) {
    createLogger(`test-module-${i}`);
  }
  let end = performance.now();
  results['Logger creation (default)'] = end - start;

  // Test 2: Logger creation with JSON format
  resetLoggerInitialization();
  process.env.UNCHAINED_LOG_FORMAT = 'json';

  start = performance.now();
  for (let i = 0; i < iterations / 100; i++) {
    createLogger(`test-module-json-${i}`);
  }
  end = performance.now();
  results['Logger creation (JSON)'] = end - start;

  // Test 3: Logging with default format
  resetLoggerInitialization();
  delete process.env.UNCHAINED_LOG_FORMAT;
  const defaultLogger = createLogger('benchmark-default');

  // Suppress actual console output during benchmark
  const originalLog = console.log;
  const originalInfo = console.info;
  console.log = () => {
    /* noop */
  };
  console.info = () => {
    /* noop */
  };

  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    defaultLogger.info('Test message');
  }
  end = performance.now();
  results['Logging (default format)'] = end - start;

  // Test 4: Logging with JSON format
  resetLoggerInitialization();
  process.env.UNCHAINED_LOG_FORMAT = 'json';
  const jsonLogger = createLogger('benchmark-json');

  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    jsonLogger.info('Test message', { index: i });
  }
  end = performance.now();
  results['Logging (JSON format)'] = end - start;

  // Test 5: Debug logging when enabled
  resetLoggerInitialization();
  process.env.DEBUG = 'benchmark-debug';
  const debugLogger = createLogger('benchmark-debug');

  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    debugLogger.debug('Debug message');
  }
  end = performance.now();
  results['Debug logging (enabled)'] = end - start;

  // Test 6: Debug logging when disabled
  resetLoggerInitialization();
  process.env.DEBUG = 'other-module';
  const noDebugLogger = createLogger('benchmark-no-debug');

  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    noDebugLogger.debug('Debug message');
  }
  end = performance.now();
  results['Debug logging (disabled)'] = end - start;

  // Restore console
  console.log = originalLog;
  console.info = originalInfo;

  // Print results
  console.log('📊 Results:\n');
  console.log('Test Name                      | Time (ms) | Ops/sec');
  console.log('-------------------------------|-----------|----------');

  for (const [name, time] of Object.entries(results)) {
    const opsPerSec = name.includes('creation')
      ? iterations / 100 / (time / 1000)
      : iterations / (time / 1000);
    console.log(
      `${name.padEnd(30)} | ${time.toFixed(2).padStart(9)} | ${opsPerSec.toFixed(0).padStart(8)}`,
    );
  }

  console.log('\n💡 Key Findings:\n');

  // Compare formats
  const defaultTime = results['Logging (default format)'];
  const jsonTime = results['Logging (JSON format)'];
  const formatDiff = (((jsonTime - defaultTime) / defaultTime) * 100).toFixed(1);
  console.log(
    `• JSON format is ${Math.abs(Number(formatDiff))}% ${Number(formatDiff) > 0 ? 'slower' : 'faster'} than default format`,
  );

  // Compare debug enabled vs disabled
  const debugEnabledTime = results['Debug logging (enabled)'];
  const debugDisabledTime = results['Debug logging (disabled)'];
  const debugDiff = (((debugDisabledTime - debugEnabledTime) / debugEnabledTime) * 100).toFixed(1);
  console.log(
    `• Debug logging when disabled is ${Math.abs(Number(debugDiff))}% ${Number(debugDiff) < 0 ? 'faster' : 'slower'} than when enabled`,
  );
}

// Run the benchmark
runBenchmark().catch(console.error);
