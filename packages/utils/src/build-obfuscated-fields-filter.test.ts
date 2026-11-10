import { describe, it } from 'node:test';
import assert from 'node:assert';
import buildObfuscatedFieldsFilter from './build-obfuscated-fields-filter.ts';

describe('buildObfuscatedFieldsFilter', () => {
  it('masks the built-in sensitive fields when nothing is configured', () => {
    const mask = buildObfuscatedFieldsFilter(undefined);

    assert.deepStrictEqual(mask({ to: 'a@b.c', password: 'hunter2', token: 'reset-abc' }), {
      to: 'a@b.c',
      password: '******',
      token: '******',
    });
  });

  it('masks nested objects and arrays', () => {
    const mask = buildObfuscatedFieldsFilter();

    assert.deepStrictEqual(mask({ items: [{ secret: 's' }, { keep: 'k' }] }), {
      items: [{ secret: '******' }, { keep: 'k' }],
    });
  });

  it('replaces the built-in list when fields are configured', () => {
    const mask = buildObfuscatedFieldsFilter(['custom']);

    assert.deepStrictEqual(mask({ custom: 'c', password: 'kept' }), {
      custom: '******',
      password: 'kept',
    });
  });

  it('masks nothing when configured with an empty list', () => {
    const mask = buildObfuscatedFieldsFilter([]);

    assert.deepStrictEqual(mask({ password: 'kept' }), { password: 'kept' });
  });

  it('does not mutate the caller object', () => {
    const mask = buildObfuscatedFieldsFilter(['password']);
    const input = { input: { password: 'hunter2' } };

    const masked = mask(input);

    assert.strictEqual(masked.input.password, '******');
    assert.strictEqual(input.input.password, 'hunter2');
    assert.notStrictEqual(masked, input);
  });

  it('keeps dates intact', () => {
    const mask = buildObfuscatedFieldsFilter();
    const scheduled = new Date('2026-01-01T00:00:00.000Z');

    assert.deepStrictEqual(mask({ scheduled }).scheduled, scheduled);
  });
});
