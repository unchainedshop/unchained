import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateId } from './index.ts';

describe('generateId', () => {
  it('should generate a 24-character hexadecimal string', () => {
    const id = generateId();
    assert.strictEqual(id.length, 24);
    assert.match(id, /^[0-9a-f]{24}$/);
  });

  it('should generate unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId());
    }
    assert.strictEqual(ids.size, 1000, 'All 1000 IDs should be unique');
  });

  it('should be sortable by insertion time', async () => {
    const id1 = generateId();

    // Wait 1.1 seconds to ensure timestamp changes
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const id2 = generateId();

    // IDs generated later should be lexicographically greater
    assert.ok(id2 > id1, `id2 (${id2}) should be greater than id1 (${id1})`);
  });

  it('should maintain order within the same second', () => {
    const ids: string[] = [];
    for (let i = 0; i < 100; i++) {
      ids.push(generateId());
    }

    // Each ID should be greater than the previous one
    for (let i = 1; i < ids.length; i++) {
      assert.ok(
        ids[i] > ids[i - 1],
        `ID at index ${i} (${ids[i]}) should be greater than ID at index ${i - 1} (${ids[i - 1]})`,
      );
    }
  });

  it('should embed timestamp in first 8 hex characters (4 bytes)', () => {
    const before = Math.floor(Date.now() / 1000);
    const id = generateId();
    const after = Math.floor(Date.now() / 1000);

    // Extract timestamp from first 8 hex chars
    const timestampHex = id.substring(0, 8);
    const timestamp = parseInt(timestampHex, 16);

    assert.ok(
      timestamp >= before && timestamp <= after,
      `Embedded timestamp ${timestamp} should be between ${before} and ${after}`,
    );
  });
});
