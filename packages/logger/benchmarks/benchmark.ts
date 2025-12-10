import { performance } from 'node:perf_hooks';
import { createLogger, resetLoggerInitialization } from '../src/createLogger.ts';

interface BenchmarkResult {
  name: string;
  totalTime: number;
  operations: number;
  opsPerSecond: number;
  avgTimeMs: number;
}

class LoggerBenchmark {
  private originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };

  private suppressConsole() {
    const noop = () => {
      /* intentionally empty */
    };
    console.log = noop;
    console.info = noop;
    console.warn = noop;
    console.error = noop;
    console.debug = noop;
  }

  private restoreConsole() {
    Object.assign(console, this.originalConsole);
  }

  private benchmark(name: string, iterations: number, fn: () => void): BenchmarkResult {
    // Warm-up phase
    for (let i = 0; i < Math.min(100, iterations / 10); i++) {
      fn();
    }

    // Actual benchmark
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    const totalTime = performance.now() - start;

    return {
      name,
      totalTime,
      operations: iterations,
      opsPerSecond: (iterations / totalTime) * 1000,
      avgTimeMs: totalTime / iterations,
    };
  }

  async run() {
    this.restoreConsole();
    console.log('🚀 Logger Performance Benchmark\n');
    console.log('Running benchmarks...\n');

    const results: BenchmarkResult[] = [];

    // Test 1: Logger creation performance
    this.suppressConsole();
    resetLoggerInitialization();
    delete process.env.UNCHAINED_LOG_FORMAT;
    delete process.env.DEBUG;
    delete process.env.LOG_LEVEL;

    results.push(
      this.benchmark('Logger creation (default format)', 1000, () => {
        createLogger(`module-${Math.random()}`);
      }),
    );

    // Test 2: Logger creation with JSON format
    resetLoggerInitialization();
    process.env.UNCHAINED_LOG_FORMAT = 'json';

    results.push(
      this.benchmark('Logger creation (JSON format)', 1000, () => {
        createLogger(`module-json-${Math.random()}`);
      }),
    );

    // Test 3: Logging performance - default format
    resetLoggerInitialization();
    delete process.env.UNCHAINED_LOG_FORMAT;
    const defaultLogger = createLogger('benchmark');

    results.push(
      this.benchmark('Log info (default format)', 100000, () => {
        defaultLogger.info('Test message');
      }),
    );

    // Test 4: Logging performance - JSON format
    resetLoggerInitialization();
    process.env.UNCHAINED_LOG_FORMAT = 'json';
    const jsonLogger = createLogger('benchmark-json');

    results.push(
      this.benchmark('Log info (JSON format)', 100000, () => {
        jsonLogger.info('Test message', { id: 123 });
      }),
    );

    // Test 5: Complex object logging
    const complexObject = {
      user: { id: 'user123', name: 'John Doe', roles: ['admin', 'user'] },
      action: 'purchase',
      items: [
        { id: 'item1', name: 'Product A', price: 99.99, quantity: 2 },
        { id: 'item2', name: 'Product B', price: 49.99, quantity: 1 },
      ],
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'web',
        version: '1.0.0',
      },
    };

    results.push(
      this.benchmark('Log complex object (JSON)', 10000, () => {
        jsonLogger.info('Complex operation', complexObject);
      }),
    );

    // Test 6: Debug logging when enabled
    resetLoggerInitialization();
    delete process.env.UNCHAINED_LOG_FORMAT;
    process.env.DEBUG = 'benchmark-debug';
    const debugEnabledLogger = createLogger('benchmark-debug');

    results.push(
      this.benchmark('Debug log (enabled)', 100000, () => {
        debugEnabledLogger.debug('Debug message');
      }),
    );

    // Test 7: Debug logging when disabled
    resetLoggerInitialization();
    process.env.DEBUG = 'other-module';
    const debugDisabledLogger = createLogger('benchmark-no-debug');

    results.push(
      this.benchmark('Debug log (disabled)', 100000, () => {
        debugDisabledLogger.debug('Debug message');
      }),
    );

    // Test 8: Pattern matching performance
    resetLoggerInitialization();
    process.env.DEBUG = 'app:*,!app:excluded,special-*,test:module:*';
    const testModules = [
      'app:users',
      'app:excluded',
      'special-feature',
      'test:module:sub',
      'other:module',
    ];

    results.push(
      this.benchmark('Pattern matching (createLogger)', 5000, () => {
        const module = testModules[Math.floor(Math.random() * testModules.length)];
        createLogger(module);
      }),
    );

    this.restoreConsole();
    this.printResults(results);
  }

  private printResults(results: BenchmarkResult[]) {
    console.log('\n📊 Benchmark Results:\n');

    // Header
    const cols = {
      name: 'Test Name',
      ops: 'Ops/sec',
      avgTime: 'Avg Time',
      total: 'Total Time',
    };

    const widths = {
      name: Math.max(cols.name.length, ...results.map((r) => r.name.length)),
      ops: 12,
      avgTime: 12,
      total: 12,
    };

    // Print header
    console.log(
      `${cols.name.padEnd(widths.name)} | ${cols.ops.padStart(widths.ops)} | ${cols.avgTime.padStart(
        widths.avgTime,
      )} | ${cols.total.padStart(widths.total)}`,
    );
    console.log(
      `${'-'.repeat(widths.name)}-|-${'-'.repeat(widths.ops)}-|-${'-'.repeat(widths.avgTime)}-|-${'-'.repeat(widths.total)}`,
    );

    // Print results
    for (const result of results) {
      const opsPerSec = this.formatNumber(result.opsPerSecond);
      const avgTime = this.formatTime(result.avgTimeMs);
      const totalTime = `${result.totalTime.toFixed(2)} ms`;

      console.log(
        `${result.name.padEnd(widths.name)} | ${opsPerSec.padStart(widths.ops)} | ${avgTime.padStart(
          widths.avgTime,
        )} | ${totalTime.padStart(widths.total)}`,
      );
    }

    // Performance insights
    console.log('\n💡 Performance Insights:\n');

    // Compare format performance
    const defaultLog = results.find((r) => r.name === 'Log info (default format)');
    const jsonLog = results.find((r) => r.name === 'Log info (JSON format)');
    if (defaultLog && jsonLog) {
      const diff = ((jsonLog.avgTimeMs - defaultLog.avgTimeMs) / defaultLog.avgTimeMs) * 100;
      console.log(
        `• JSON format logging is ${Math.abs(diff).toFixed(1)}% ${diff > 0 ? 'slower' : 'faster'} than default format`,
      );
    }

    // Compare debug enabled vs disabled
    const debugEnabled = results.find((r) => r.name === 'Debug log (enabled)');
    const debugDisabled = results.find((r) => r.name === 'Debug log (disabled)');
    if (debugEnabled && debugDisabled) {
      const speedup = debugEnabled.avgTimeMs / debugDisabled.avgTimeMs;
      console.log(
        `• Debug logging when disabled is ${speedup.toFixed(1)}x faster (skips log processing entirely)`,
      );
    }

    // Find fastest and slowest
    const sorted = [...results].sort((a, b) => b.opsPerSecond - a.opsPerSecond);
    console.log(
      `• Fastest operation: ${sorted[0].name} (${this.formatNumber(sorted[0].opsPerSecond)} ops/s)`,
    );
    console.log(
      `• Slowest operation: ${sorted[sorted.length - 1].name} (${this.formatNumber(
        sorted[sorted.length - 1].opsPerSecond,
      )} ops/s)`,
    );

    // Memory note
    console.log(
      `\n📝 Note: These benchmarks measure execution speed. Memory usage and garbage collection`,
    );
    console.log(`   impact are not measured but may be important factors in production environments.`);
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(0);
  }

  private formatTime(ms: number): string {
    if (ms < 0.001) return `${(ms * 1000).toFixed(2)} µs`;
    if (ms < 1) return `${ms.toFixed(3)} ms`;
    return `${ms.toFixed(2)} ms`;
  }
}

// Run benchmark
const benchmark = new LoggerBenchmark();
benchmark.run().catch(console.error);
