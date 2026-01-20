import { describe, it } from 'node:test';
import assert from 'node:assert';
import sha256 from './sha256.ts';

describe('sha256', () => {
  it('should hash a simple string', async () => {
    const result = await sha256('hello');
    assert.strictEqual(result, '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('should hash an empty string', async () => {
    const result = await sha256('');
    assert.strictEqual(result, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('should return 64-character hex string', async () => {
    const result = await sha256('test');
    assert.strictEqual(result.length, 64);
    assert.match(result, /^[0-9a-f]+$/);
  });
});
