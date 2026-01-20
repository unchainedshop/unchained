import { describe, it } from 'node:test';
import assert from 'node:assert';
import sha1 from './sha1.ts';

describe('sha1', () => {
  it('should hash a simple string', async () => {
    const result = await sha1('hello');
    assert.ok(result instanceof Uint8Array);
    assert.strictEqual(result.length, 20); // SHA-1 produces 20 bytes
  });

  it('should hash an empty string', async () => {
    const result = await sha1('');
    assert.ok(result instanceof Uint8Array);
    assert.strictEqual(result.length, 20);
  });
});
