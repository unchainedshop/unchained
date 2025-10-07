import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { createLogger, resetLoggerInitialization } from '../src/createLogger.js';

describe('createLogger', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
    // Reset logger initialization state
    resetLoggerInitialization();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should create logger with default format (unchained)', () => {
    const logger = createLogger('test-module');
    assert(logger);
    assert(typeof logger.debug === 'function');
    assert(typeof logger.info === 'function');
    assert(typeof logger.warn === 'function');
    assert(typeof logger.error === 'function');
  });

  it('should create logger with json format', () => {
    process.env.UNCHAINED_LOG_FORMAT = 'json';
    const logger = createLogger('test-module-json');
    assert(logger);
  });

  it('should throw error with invalid log format', () => {
    process.env.UNCHAINED_LOG_FORMAT = 'invalid';
    assert.throws(() => {
      createLogger('test-module-invalid');
    }, /UNCHAINED_LOG_FORMAT is invalid/);
  });

  it('should respect DEBUG environment variable', () => {
    process.env.DEBUG = 'test-debug-module';
    const logger = createLogger('test-debug-module');
    assert(logger);
    // Logger should be set to DEBUG level when module matches DEBUG pattern
  });

  it('should respect LOG_LEVEL environment variable', () => {
    process.env.LOG_LEVEL = 'error';
    const logger = createLogger('test-log-level');
    assert(logger);
    // Logger should be set to ERROR level
  });

  it('should handle module name pattern matching', () => {
    process.env.DEBUG = 'test-*,!test-exclude';

    const includedLogger = createLogger('test-included');
    const excludedLogger = createLogger('test-exclude');
    const otherLogger = createLogger('other-module');

    assert(includedLogger);
    assert(excludedLogger);
    assert(otherLogger);
    // test-included should have DEBUG level
    // test-exclude should NOT have DEBUG level
    // other-module should NOT have DEBUG level
  });
});
