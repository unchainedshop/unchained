import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { createLogger, resetLoggerInitialization } from '../src/createLogger.ts';

describe('createLogger', () => {
  const originalEnv = process.env;
  let consoleOutput: string[] = [];
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
  };

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
    // Reset logger initialization state
    resetLoggerInitialization();

    // Capture console output
    consoleOutput = [];
    const captureOutput = (...args: any[]) => {
      // Join all arguments into a single string
      const output = args
        .map((arg) => {
          if (typeof arg === 'string') {
            return arg;
          } else if (arg === undefined) {
            return 'undefined';
          } else if (arg === null) {
            return 'null';
          } else {
            try {
              return JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          }
        })
        .join(' ');
      consoleOutput.push(output);
    };

    console.log = mock.fn(captureOutput);
    console.warn = mock.fn(captureOutput);
    console.error = mock.fn(captureOutput);
    console.info = mock.fn(captureOutput);
    console.debug = mock.fn(captureOutput);
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    // Restore console
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
  });

  describe('Basic functionality', () => {
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

      // Clear previous output
      consoleOutput = [];

      // The JSON logger expects two arguments: message and metadata object
      logger.info('test message', { metadata: 'value' });

      // Check if we got output
      assert(consoleOutput.length > 0, 'No console output captured');

      // The output should be a single JSON string
      const lastOutput = consoleOutput[consoleOutput.length - 1];

      // Verify JSON format output
      const parsed = JSON.parse(lastOutput);
      assert(parsed.level === 'INFO');
      assert(parsed.name === 'test-module-json');
      assert(parsed.message === 'test message');
      assert(parsed.metadata === 'value');
      assert(parsed.timestamp); // Should have a timestamp
    });

    it('should throw error with invalid log format', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'invalid';
      assert.throws(() => {
        createLogger('test-module-invalid');
      }, /UNCHAINED_LOG_FORMAT is invalid/);
    });
  });

  describe('DEBUG environment variable patterns', () => {
    it('should respect simple DEBUG pattern', () => {
      process.env.DEBUG = 'test-debug-module';
      process.env.LOG_LEVEL = 'info';

      const logger = createLogger('test-debug-module');
      logger.debug('debug message');

      // Debug message should appear
      assert(consoleOutput.some((output) => output.includes('debug message')));
    });

    it('should handle wildcard patterns', () => {
      process.env.DEBUG = 'test-*';
      process.env.LOG_LEVEL = 'info';

      const logger1 = createLogger('test-module-1');
      const logger2 = createLogger('test-module-2');
      const logger3 = createLogger('other-module');

      logger1.debug('debug1');
      logger2.debug('debug2');
      logger3.debug('debug3');

      // Only test-* modules should output debug
      assert(consoleOutput.some((output) => output.includes('debug1')));
      assert(consoleOutput.some((output) => output.includes('debug2')));
      assert(!consoleOutput.some((output) => output.includes('debug3')));
    });

    it('should handle exclusion patterns', () => {
      process.env.DEBUG = 'test-*,-test-exclude';
      process.env.LOG_LEVEL = 'info';

      const includedLogger = createLogger('test-included');
      const excludedLogger = createLogger('test-exclude');

      includedLogger.debug('included');
      excludedLogger.debug('excluded');

      assert(consoleOutput.some((output) => output.includes('included')));
      assert(!consoleOutput.some((output) => output.includes('excluded')));
    });

    it('should handle multiple patterns', () => {
      process.env.DEBUG = 'auth-*,payment-*,-payment-debug';
      process.env.LOG_LEVEL = 'info';

      const authLogger = createLogger('auth-service');
      const paymentLogger = createLogger('payment-service');
      const paymentDebugLogger = createLogger('payment-debug');
      const otherLogger = createLogger('other-service');

      authLogger.debug('auth debug');
      paymentLogger.debug('payment debug');
      paymentDebugLogger.debug('payment-debug debug');
      otherLogger.debug('other debug');

      assert(consoleOutput.some((output) => output.includes('auth debug')));
      assert(consoleOutput.some((output) => output.includes('payment debug')));
      assert(!consoleOutput.some((output) => output.includes('payment-debug debug')));
      assert(!consoleOutput.some((output) => output.includes('other debug')));
    });

    it('should handle colon in module names', () => {
      process.env.DEBUG = 'module:*';

      const logger1 = createLogger('module:sub1');
      const logger2 = createLogger('module:sub2');
      const logger3 = createLogger('other-module');

      logger1.debug('debug1');
      logger2.debug('debug2');
      logger3.debug('debug3');

      assert(consoleOutput.some((output) => output.includes('debug1')));
      assert(consoleOutput.some((output) => output.includes('debug2')));
      assert(!consoleOutput.some((output) => output.includes('debug3')));
    });
  });

  describe('Circular dependencies in JSON format', () => {
    it('should handle circular references in objects', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('circular-test');

      const obj1: any = { name: 'obj1' };
      const obj2: any = { name: 'obj2', ref: obj1 };
      obj1.ref = obj2; // Create circular reference

      consoleOutput = [];
      logger.info('circular object', { data: obj1 });

      // Should not throw and should produce valid JSON
      assert(consoleOutput.length > 0, 'No console output captured');
      const lastOutput = consoleOutput[consoleOutput.length - 1];

      assert.doesNotThrow(() => JSON.parse(lastOutput));

      const parsed = JSON.parse(lastOutput);
      assert(parsed.message === 'circular object');
      assert(parsed.data.name === 'obj1');
      // Circular reference should be replaced with "[Circular]"
      assert(parsed.data.ref.ref === '[Circular]');
    });

    it('should handle self-referencing objects', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('self-ref-test');

      const obj: any = { name: 'self' };
      obj.self = obj;

      consoleOutput = [];
      logger.info('self reference', { data: obj });

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      assert.doesNotThrow(() => JSON.parse(lastOutput));

      const parsed = JSON.parse(lastOutput);
      assert(parsed.data.name === 'self');
      assert(parsed.data.self === '[Circular]');
    });

    it('should handle deeply nested circular references', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('deep-circular-test');

      const obj: any = {
        level1: {
          level2: {
            level3: {},
          },
        },
      };
      obj.level1.level2.level3.circular = obj;

      consoleOutput = [];
      logger.info('deep circular', { data: obj });

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      assert.doesNotThrow(() => JSON.parse(lastOutput));

      const parsed = JSON.parse(lastOutput);
      assert(parsed.data.level1.level2.level3.circular === '[Circular]');
    });
  });

  describe('Error object logging', () => {
    it('should log Error objects in unchained format', () => {
      const logger = createLogger('error-test');
      const error = new Error('Test error message');

      logger.error('Error occurred', error);

      assert(consoleOutput.some((output) => output.includes('Error occurred')));
    });

    it('should log Error objects in JSON format', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('error-json-test');

      const error = new Error('Test error message');
      error.stack = 'Error: Test error message\n    at Test.fn';

      consoleOutput = [];
      logger.error('Error occurred', { error });

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      const parsed = JSON.parse(lastOutput);
      assert(parsed.message === 'Error occurred');
      assert(parsed.level === 'ERROR');
      // Error objects are serialized as empty objects by default in JSON
      assert(typeof parsed.error === 'object');
      assert(Object.keys(parsed.error).length === 0);
    });

    it('should handle custom error properties', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('custom-error-test');

      class CustomError extends Error {
        code: string;
        statusCode: number;

        constructor(message: string, code: string, statusCode: number) {
          super(message);
          this.code = code;
          this.statusCode = statusCode;
        }
      }

      const error = new CustomError('Custom error', 'ERR_CUSTOM', 400);

      consoleOutput = [];
      logger.error('Custom error occurred', { error, additionalInfo: 'extra' });

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      const parsed = JSON.parse(lastOutput);
      assert(parsed.additionalInfo === 'extra');
      assert(parsed.level === 'ERROR');
      // Error objects including custom errors are serialized as empty objects
      assert(typeof parsed.error === 'object');
    });

    it('should handle Error with circular references', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('circular-error-test');

      const error: any = new Error('Circular error');
      error.circular = error;

      consoleOutput = [];
      logger.error('Circular error', { error });

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      assert.doesNotThrow(() => JSON.parse(lastOutput));

      const parsed = JSON.parse(lastOutput);
      assert(parsed.level === 'ERROR');
      // Error is serialized as empty object, circular property is ignored
      assert(typeof parsed.error === 'object');
    });
  });

  describe('Edge cases and special values', () => {
    it('should handle null values', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('null-test');

      consoleOutput = [];
      logger.info('null value', { value: null });

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      const parsed = JSON.parse(lastOutput);
      assert(parsed.value === null);
      assert(parsed.message === 'null value');
    });

    it('should handle undefined values', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('undefined-test');

      consoleOutput = [];
      logger.info('undefined value', { value: undefined });

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      const parsed = JSON.parse(lastOutput);
      // undefined should be omitted in JSON
      assert(!('value' in parsed));
      assert(parsed.message === 'undefined value');
    });

    it('should handle NaN and Infinity', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('nan-infinity-test');

      consoleOutput = [];
      logger.info('special numbers', {
        nan: NaN,
        infinity: Infinity,
        negInfinity: -Infinity,
      });

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      const parsed = JSON.parse(lastOutput);
      // NaN and Infinity are serialized as null by safe-stable-stringify
      assert(parsed.nan === null);
      assert(parsed.infinity === null);
      assert(parsed.negInfinity === null);
    });

    it('should handle BigInt values', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('bigint-test');

      consoleOutput = [];
      logger.info('bigint value', { value: BigInt('9007199254740993') });

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      const parsed = JSON.parse(lastOutput);
      // BigInt is serialized as string by safe-stable-stringify
      assert(typeof parsed.value === 'string');
      assert(parsed.value === '9007199254740993');
    });

    it('should handle Symbol values', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('symbol-test');

      const sym = Symbol('test');

      consoleOutput = [];
      logger.info('symbol value', { value: sym });

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      const parsed = JSON.parse(lastOutput);
      // Symbols should be omitted in JSON
      assert(!('value' in parsed));
    });

    it('should handle functions', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('function-test');

      const fn = () => 'test';

      consoleOutput = [];
      logger.info('function value', { value: fn });

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      const parsed = JSON.parse(lastOutput);
      // Functions should be omitted in JSON
      assert(!('value' in parsed));
    });

    it('should handle Date objects', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('date-test');

      const date = new Date('2023-01-01T00:00:00.000Z');

      consoleOutput = [];
      logger.info('date value', { value: date });

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      const parsed = JSON.parse(lastOutput);
      // Dates are serialized as ISO strings
      assert(parsed.value === '2023-01-01T00:00:00.000Z');
    });

    it('should handle RegExp objects', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('regexp-test');

      const regex = /test/gi;

      consoleOutput = [];
      logger.info('regex value', { value: regex });

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      const parsed = JSON.parse(lastOutput);
      // RegExp objects are serialized as empty objects in JSON
      assert(typeof parsed.value === 'object' && Object.keys(parsed.value).length === 0);
    });

    it('should handle empty strings', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('empty-string-test');

      consoleOutput = [];
      logger.info('', { emptyKey: '' });

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      const parsed = JSON.parse(lastOutput);
      assert(parsed.message === '');
      assert(parsed.emptyKey === '');
    });

    it('should handle arrays with mixed types', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('mixed-array-test');

      consoleOutput = [];
      logger.info('mixed array', {
        array: [1, 'string', null, undefined, { nested: true }, [1, 2, 3]],
      });

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      const parsed = JSON.parse(lastOutput);
      assert(Array.isArray(parsed.array));
      assert(parsed.array[0] === 1);
      assert(parsed.array[1] === 'string');
      assert(parsed.array[2] === null);
      assert(parsed.array[3] === null); // undefined becomes null in JSON
      assert(parsed.array[4].nested === true);
      assert(Array.isArray(parsed.array[5]));
    });
  });

  describe('Different log levels', () => {
    it('should respect LOG_LEVEL environment variable', () => {
      process.env.LOG_LEVEL = 'error';
      const logger = createLogger('log-level-test');

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      // Only error messages should appear
      assert(!consoleOutput.some((output) => output.includes('debug message')));
      assert(!consoleOutput.some((output) => output.includes('info message')));
      assert(!consoleOutput.some((output) => output.includes('warn message')));
      assert(consoleOutput.some((output) => output.includes('error message')));
    });

    it('should handle all log levels', () => {
      process.env.LOG_LEVEL = 'verbose';
      const logger = createLogger('all-levels-test');

      logger.trace('trace message');
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      // All messages should appear
      assert(consoleOutput.some((output) => output.includes('trace message')));
      assert(consoleOutput.some((output) => output.includes('debug message')));
      assert(consoleOutput.some((output) => output.includes('info message')));
      assert(consoleOutput.some((output) => output.includes('warn message')));
      assert(consoleOutput.some((output) => output.includes('error message')));
    });

    it('should handle case-insensitive log levels', () => {
      process.env.LOG_LEVEL = 'WaRn';
      const logger = createLogger('case-test');

      consoleOutput = [];
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      assert(!consoleOutput.some((output) => output.includes('info message')));
      assert(consoleOutput.some((output) => output.includes('warn message')));
      assert(consoleOutput.some((output) => output.includes('error message')));
    });
  });

  describe('Multiple logger instances', () => {
    it('should maintain separate loggers for different modules', () => {
      process.env.DEBUG = 'module1';

      const logger1 = createLogger('module1');
      const logger2 = createLogger('module2');

      logger1.debug('module1 debug');
      logger2.debug('module2 debug');

      assert(consoleOutput.some((output) => output.includes('module1 debug')));
      assert(!consoleOutput.some((output) => output.includes('module2 debug')));
    });

    it('should share format configuration across instances', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';

      consoleOutput = [];
      const logger1 = createLogger('json-module1');
      const logger2 = createLogger('json-module2');

      logger1.info('message1');
      logger2.info('message2');

      // Both should output JSON
      assert(consoleOutput.length === 2);

      const parsed1 = JSON.parse(consoleOutput[0]);
      const parsed2 = JSON.parse(consoleOutput[1]);

      assert(parsed1.name === 'json-module1');
      assert(parsed1.message === 'message1');
      assert(parsed1.level === 'INFO');

      assert(parsed2.name === 'json-module2');
      assert(parsed2.message === 'message2');
      assert(parsed2.level === 'INFO');
    });
  });

  describe('Security', () => {
    it('should be immune to ReDoS attacks via DEBUG pattern', () => {
      // This pattern would cause catastrophic backtracking in a vulnerable regex:
      // (a+)+ with input 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!'
      // A vulnerable implementation would hang for seconds/minutes
      const maliciousPatterns = [
        '(a+)+', // Nested quantifiers
        '(a|a)+', // Alternation with overlap
        '(a|aa)+', // Alternation with overlap
        '([a-zA-Z]+)*', // Nested quantifiers with character class
        '(.*a){10}', // Greedy with repetition
        '(?:a+)+', // Non-capturing nested quantifiers
      ];

      const startTime = Date.now();

      for (const pattern of maliciousPatterns) {
        process.env.DEBUG = pattern;
        resetLoggerInitialization();

        // This input would cause exponential backtracking in vulnerable patterns
        const maliciousInput = 'a'.repeat(30) + '!';

        // Creating the logger should not hang
        const logger = createLogger(maliciousInput);

        // Should complete almost instantly (< 100ms per pattern)
        // A vulnerable implementation would take seconds or minutes
        assert(logger);
      }

      const elapsed = Date.now() - startTime;
      // All patterns should complete in under 1 second total
      // A vulnerable implementation would take much longer
      assert(elapsed < 1000, `ReDoS protection failed: took ${elapsed}ms`);
    });

    it('should still match valid patterns after escaping', () => {
      // Ensure escaping doesn't break legitimate patterns
      process.env.DEBUG = 'unchained:*';
      resetLoggerInitialization();

      const logger1 = createLogger('unchained:core');
      const logger2 = createLogger('unchained:api:graphql');
      const logger3 = createLogger('other-module');

      consoleOutput = [];
      logger1.debug('should appear');
      logger2.debug('should also appear');
      logger3.debug('should not appear');

      assert(consoleOutput.some((output) => output.includes('should appear')));
      assert(consoleOutput.some((output) => output.includes('should also appear')));
      assert(!consoleOutput.some((output) => output.includes('should not appear')));
    });

    it('should handle special regex characters in DEBUG pattern safely', () => {
      // These characters should be escaped and treated literally
      process.env.DEBUG = 'module.name+test';
      resetLoggerInitialization();

      const logger1 = createLogger('module.name+test');
      const logger2 = createLogger('modulexname+test'); // . should not match any char
      const logger3 = createLogger('module.nametest'); // + should not mean "one or more"

      consoleOutput = [];
      logger1.debug('exact match');
      logger2.debug('dot as wildcard');
      logger3.debug('plus as quantifier');

      assert(consoleOutput.some((output) => output.includes('exact match')));
      assert(!consoleOutput.some((output) => output.includes('dot as wildcard')));
      assert(!consoleOutput.some((output) => output.includes('plus as quantifier')));
    });

    it('should guard against prototype pollution via __proto__', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('prototype-pollution-test');

      const maliciousPayload = JSON.parse('{"__proto__": {"polluted": "value"}}');

      consoleOutput = [];
      logger.info('test', maliciousPayload);

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      const parsed = JSON.parse(lastOutput);

      // Should not pollute Object prototype
      assert.strictEqual('polluted' in Object.prototype, false);
      assert.strictEqual('polluted' in {}, false);
      // The dangerous __proto__ key should be filtered out
      // Check that we only have expected keys
      const keys = Object.keys(parsed);
      assert.strictEqual(keys.includes('__proto__'), false);
    });

    it('should guard against prototype pollution via constructor', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('constructor-pollution-test');

      const maliciousPayload = { constructor: { polluted: 'value' } };

      consoleOutput = [];
      logger.info('test', maliciousPayload);

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      const parsed = JSON.parse(lastOutput);

      // The dangerous constructor key should be filtered out
      const keys = Object.keys(parsed);
      assert.strictEqual(keys.includes('constructor'), false);
      // Verify the constructor wasn't overridden with the malicious payload
      assert.notStrictEqual(parsed.constructor, maliciousPayload.constructor);
    });

    it('should guard against prototype pollution via prototype', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('prototype-key-test');

      const maliciousPayload = { prototype: { polluted: 'value' } };

      consoleOutput = [];
      logger.info('test', maliciousPayload);

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      const parsed = JSON.parse(lastOutput);

      // The dangerous prototype key should be filtered out
      const keys = Object.keys(parsed);
      assert.strictEqual(keys.includes('prototype'), false);
    });

    it('should allow safe keys while blocking dangerous ones', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('mixed-keys-test');

      const mixedPayload = {
        safeKey: 'safe value',
        __proto__: { dangerous: 'value' },
        anotherSafe: 123,
        constructor: { dangerous: 'value' },
        validKey: true,
        prototype: { dangerous: 'value' },
      };

      consoleOutput = [];
      logger.info('test', mixedPayload);

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      const parsed = JSON.parse(lastOutput);

      // Safe keys should be present
      assert.strictEqual(parsed.safeKey, 'safe value');
      assert.strictEqual(parsed.anotherSafe, 123);
      assert.strictEqual(parsed.validKey, true);

      // Dangerous keys should be filtered out
      const keys = Object.keys(parsed);
      assert.strictEqual(keys.includes('__proto__'), false);
      assert.strictEqual(keys.includes('constructor'), false);
      assert.strictEqual(keys.includes('prototype'), false);
    });
  });

  describe('Format edge cases', () => {
    it('should handle very long messages', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('long-message-test');

      consoleOutput = [];
      const longMessage = 'x'.repeat(10000);
      logger.info(longMessage);

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      const parsed = JSON.parse(lastOutput);
      assert(parsed.message.length === 10000);
      assert(parsed.message === longMessage);
    });

    it('should handle special characters in messages', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('special-chars-test');

      consoleOutput = [];
      logger.info('Special chars: \n\r\t"\'\\', {
        data: 'Line 1\nLine 2\tTabbed',
      });

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      const parsed = JSON.parse(lastOutput);
      assert(parsed.message.includes('\n'));
      assert(parsed.message.includes('\r'));
      assert(parsed.message.includes('\t'));
      assert(parsed.message.includes('"'));
      assert(parsed.message.includes("'"));
      assert(parsed.message.includes('\\'));
      assert(parsed.data.includes('\n'));
      assert(parsed.data.includes('\t'));
    });

    it('should handle unicode characters', () => {
      process.env.UNCHAINED_LOG_FORMAT = 'json';
      const logger = createLogger('unicode-test');

      consoleOutput = [];
      logger.info('Unicode: 🔥 emoji, 中文, العربية', {
        emoji: '🚀',
        chinese: '你好',
        arabic: 'مرحبا',
      });

      const lastOutput = consoleOutput[consoleOutput.length - 1];
      const parsed = JSON.parse(lastOutput);
      assert(parsed.message.includes('🔥'));
      assert(parsed.message.includes('中文'));
      assert(parsed.message.includes('العربية'));
      assert(parsed.emoji === '🚀');
      assert(parsed.chinese === '你好');
      assert(parsed.arabic === 'مرحبا');
    });
  });
});
