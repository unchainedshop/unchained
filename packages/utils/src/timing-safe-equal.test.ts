import assert from 'node:assert';
import test from 'node:test';
import { timingSafeEqual, timingSafeStringEqual } from './timing-safe-equal.ts';

test.describe('timingSafeEqual', () => {
  test('should return true for identical buffers', async () => {
    const encoder = new TextEncoder();
    const a = encoder.encode('secret-token-123');
    const b = encoder.encode('secret-token-123');
    const result = await timingSafeEqual(a.buffer, b.buffer);
    assert.strictEqual(result, true);
  });

  test('should return false for different buffers', async () => {
    const encoder = new TextEncoder();
    const a = encoder.encode('secret-token-123');
    const b = encoder.encode('secret-token-124');
    const result = await timingSafeEqual(a.buffer, b.buffer);
    assert.strictEqual(result, false);
  });

  test('should return false for buffers of different lengths', async () => {
    const encoder = new TextEncoder();
    const a = encoder.encode('short');
    const b = encoder.encode('much-longer-string');
    const result = await timingSafeEqual(a.buffer, b.buffer);
    assert.strictEqual(result, false);
  });

  test('should return true for empty buffers', async () => {
    const a = new ArrayBuffer(0);
    const b = new ArrayBuffer(0);
    const result = await timingSafeEqual(a, b);
    assert.strictEqual(result, true);
  });
});

test.describe('timingSafeStringEqual', () => {
  test('should return true for identical strings', async () => {
    const result = await timingSafeStringEqual('password123', 'password123');
    assert.strictEqual(result, true);
  });

  test('should return false for different strings', async () => {
    const result = await timingSafeStringEqual('password123', 'password124');
    assert.strictEqual(result, false);
  });

  test('should return false for strings of different lengths', async () => {
    const result = await timingSafeStringEqual('short', 'much-longer-string');
    assert.strictEqual(result, false);
  });

  test('should return true for empty strings', async () => {
    const result = await timingSafeStringEqual('', '');
    assert.strictEqual(result, true);
  });

  test('should return false for null input', async () => {
    const result = await timingSafeStringEqual(null as any, 'test');
    assert.strictEqual(result, false);
  });

  test('should return false for undefined input', async () => {
    const result = await timingSafeStringEqual(undefined as any, 'test');
    assert.strictEqual(result, false);
  });

  test('should return false when both inputs are null', async () => {
    const result = await timingSafeStringEqual(null as any, null as any);
    assert.strictEqual(result, false);
  });

  test('should handle unicode strings correctly', async () => {
    const result1 = await timingSafeStringEqual('Hello 世界', 'Hello 世界');
    assert.strictEqual(result1, true);

    const result2 = await timingSafeStringEqual('Hello 世界', 'Hello 世界!');
    assert.strictEqual(result2, false);
  });

  test('should handle hex hash strings (typical password hash scenario)', async () => {
    const hash1 = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
    const hash2 = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
    const hash3 = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b3'; // Last char different

    const result1 = await timingSafeStringEqual(hash1, hash2);
    assert.strictEqual(result1, true);

    const result2 = await timingSafeStringEqual(hash1, hash3);
    assert.strictEqual(result2, false);
  });
});

test.describe('Timing attack resistance', () => {
  test('should have consistent timing regardless of where strings differ', async () => {
    // This is a heuristic test - we can't perfectly verify constant-time behavior
    // in JavaScript. What it can catch is an implementation that short-circuits on the
    // first differing byte, which makes an early difference far cheaper than a late one.

    const baseString = 'a'.repeat(1000);
    const earlyDiff = 'b' + 'a'.repeat(999); // Differs at position 0
    const lateDiff = 'a'.repeat(999) + 'b'; // Differs at last position

    const iterations = 100;
    const measure = async (candidate: string) => {
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        await timingSafeStringEqual(baseString, candidate);
      }
      return performance.now() - start;
    };

    // Warm up first: whichever candidate is measured first otherwise pays for JIT warmup
    // alone, which dwarfs the effect under test (~2x on a cold round vs ~1.05x once warm).
    await measure(earlyDiff);
    await measure(lateDiff);

    // Alternate which candidate leads each round so machine-wide drift cannot favour one
    // of them, and compare medians so a single GC pause cannot decide the outcome.
    const earlyTimes: number[] = [];
    const lateTimes: number[] = [];
    for (let round = 0; round < 9; round++) {
      if (round % 2 === 0) {
        earlyTimes.push(await measure(earlyDiff));
        lateTimes.push(await measure(lateDiff));
      } else {
        lateTimes.push(await measure(lateDiff));
        earlyTimes.push(await measure(earlyDiff));
      }
    }

    const median = (values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    };
    const earlyTime = median(earlyTimes);
    const lateTime = median(lateTimes);

    // The times should be roughly similar (within 3x - accounting for JIT, GC, etc.)
    // This is not a perfect test but helps catch obvious timing leaks
    const ratio = Math.max(earlyTime, lateTime) / Math.min(earlyTime, lateTime);
    assert.ok(
      ratio < 3,
      `Timing ratio ${ratio.toFixed(2)} is suspiciously high, may indicate timing leak`,
    );
  });
});
