import assert from 'node:assert';
import test from 'node:test';
import { intervalUntilTimeout } from './wait.js';

test.describe('wait utilities', () => {
  test.describe('intervalUntilTimeout function', () => {
    test('should resolve when check function returns truthy value', async () => {
      let callCount = 0;
      const checkFn = () => {
        callCount++;
        if (callCount === 3) return 'success';
        return false;
      };

      const result = await intervalUntilTimeout(checkFn, 1000, 10);

      assert.strictEqual(result, 'success');
      assert.strictEqual(callCount, 3);
    });

    test('should resolve false when timeout is reached without success', async () => {
      const checkFn = () => false;

      const start = Date.now();
      const result = await intervalUntilTimeout(checkFn, 200, 4);
      const elapsed = Date.now() - start;

      assert.strictEqual(result, false);
      // Should take approximately the timeout duration
      assert(elapsed >= 180 && elapsed <= 250, `Expected ~200ms, got ${elapsed}ms`);
    });

    test('should handle exceptions in check function gracefully', async () => {
      let callCount = 0;
      const checkFn = () => {
        callCount++;
        if (callCount === 2) throw new Error('Test error');
        if (callCount === 4) return 'success';
        return false;
      };

      const result = await intervalUntilTimeout(checkFn, 1000, 10);

      assert.strictEqual(result, 'success');
      assert(callCount >= 4);
    });

    test('should use default step count when not provided', async () => {
      let callCount = 0;
      const checkFn = () => {
        callCount++;
        return false;
      };

      await intervalUntilTimeout(checkFn, 300);

      // With default stepCount of 10, interval should be 30ms
      // In 300ms, it should be called ~10 times
      assert(callCount >= 8 && callCount <= 12, `Expected ~10 calls, got ${callCount}`);
    });
  });
});
