import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateSalt, getDerivedKey, compare } from './pbkdf2.ts';

describe('pbkdf2', () => {
  describe('generateSalt', () => {
    it('should generate 32-char hex string by default (16 bytes)', () => {
      const salt = generateSalt();
      assert.strictEqual(salt.length, 32);
      assert.match(salt, /^[0-9a-f]+$/);
    });

    it('should generate different salts each time', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      assert.notStrictEqual(salt1, salt2);
    });
  });

  describe('getDerivedKey', () => {
    it('should derive consistent key for same inputs', async () => {
      const salt = 'abcd1234abcd1234abcd1234abcd1234';
      const key1 = await getDerivedKey(salt, 'password', 1000, 64);
      const key2 = await getDerivedKey(salt, 'password', 1000, 64);
      assert.strictEqual(key1, key2);
    });

    it('should derive different key for different passwords', async () => {
      const salt = 'abcd1234abcd1234abcd1234abcd1234';
      const key1 = await getDerivedKey(salt, 'password1', 1000, 64);
      const key2 = await getDerivedKey(salt, 'password2', 1000, 64);
      assert.notStrictEqual(key1, key2);
    });
  });

  describe('compare', () => {
    it('should return true for matching password', async () => {
      const salt = 'abcd1234abcd1234abcd1234abcd1234';
      // Use default iterations and keyLength (same as compare internally uses)
      const hash = await getDerivedKey(salt, 'password');
      const result = await compare('password', hash, salt);
      assert.strictEqual(result, true);
    });

    it('should return false for wrong password', async () => {
      const salt = 'abcd1234abcd1234abcd1234abcd1234';
      const hash = await getDerivedKey(salt, 'password');
      const result = await compare('wrongpassword', hash, salt);
      assert.strictEqual(result, false);
    });
  });
});
