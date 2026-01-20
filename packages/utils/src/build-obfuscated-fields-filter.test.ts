import { describe, it } from 'node:test';
import assert from 'node:assert';
import buildObfuscatedFieldsFilter from './build-obfuscated-fields-filter.ts';

describe('buildObfuscatedFieldsFilter', () => {
  it('should obfuscate specified sensitive fields', () => {
    const filter = buildObfuscatedFieldsFilter(['password', 'secret']);
    const data = { password: 'secret123', username: 'john' };
    const result = filter(data);
    assert.strictEqual(result.password, '******');
    assert.strictEqual(result.username, 'john');
  });

  it('should obfuscate nested objects', () => {
    const filter = buildObfuscatedFieldsFilter(['password']);
    const data = { user: { password: 'secret', name: 'john' } };
    const result = filter(data);
    assert.strictEqual(result.user.password, '******');
    assert.strictEqual(result.user.name, 'john');
  });

  it('should handle arrays', () => {
    const filter = buildObfuscatedFieldsFilter(['password']);
    const data = [{ password: 'a' }, { password: 'b' }];
    const result = filter(data);
    assert.strictEqual(result[0].password, '******');
    assert.strictEqual(result[1].password, '******');
  });

  it('should handle null/undefined', () => {
    const filter = buildObfuscatedFieldsFilter(['password']);
    assert.strictEqual(filter(null), null);
    assert.strictEqual(filter(undefined), undefined);
  });

  it('should handle primitive values', () => {
    const filter = buildObfuscatedFieldsFilter(['password']);
    assert.strictEqual(filter('string'), 'string');
    assert.strictEqual(filter(123), 123);
    assert.strictEqual(filter(true), true);
  });

  it('should use custom sensitive fields and not obfuscate others', () => {
    const filter = buildObfuscatedFieldsFilter(['custom']);
    const data = { custom: 'secret', password: 'visible' };
    const result = filter(data);
    assert.strictEqual(result.custom, '******');
    assert.strictEqual(result.password, 'visible');
  });
});
