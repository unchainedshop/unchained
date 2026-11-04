import { describe, it } from 'node:test';
import assert from 'node:assert';
import buildObfuscatedFieldsFilter, {
  defaultObfuscatedFields,
} from './build-obfuscated-fields-filter.ts';

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

describe('buildObfuscatedFieldsFilter defaults', () => {
  it('masks the default fields when no list is configured', () => {
    for (const filter of [buildObfuscatedFieldsFilter(), buildObfuscatedFieldsFilter(null)]) {
      const result = filter({
        password: 'a',
        newPassword: 'b',
        oldPassword: 'c',
        authorization: 'Bearer d',
        secret: 'e',
        accessKey: 'f',
        accessToken: 'g',
        token: 'h',
        userId: 'visible',
      });
      assert.deepStrictEqual(result, {
        password: '******',
        newPassword: '******',
        oldPassword: '******',
        authorization: '******',
        secret: '******',
        accessKey: '******',
        accessToken: '******',
        token: '******',
        userId: 'visible',
      });
    }
  });

  it('exports the default fields', () => {
    assert.ok(defaultObfuscatedFields.includes('token'));
    assert.ok(defaultObfuscatedFields.includes('password'));
  });

  it('masks nothing with an empty list', () => {
    const filter = buildObfuscatedFieldsFilter([]);
    assert.deepStrictEqual(filter({ password: 'a', token: 'b' }), { password: 'a', token: 'b' });
  });

  it('matches keys case-insensitively', () => {
    const defaults = buildObfuscatedFieldsFilter();
    assert.deepStrictEqual(
      defaults({ Authorization: 'a', ACCESSTOKEN: 'b', accesskey: 'c', Token: 'd' }),
      { Authorization: '******', ACCESSTOKEN: '******', accesskey: '******', Token: '******' },
    );

    const custom = buildObfuscatedFieldsFilter(['SECRET_KEY']);
    assert.deepStrictEqual(custom({ secret_key: 'a', Secret_Key: 'b', password: 'c' }), {
      secret_key: '******',
      Secret_Key: '******',
      password: 'c',
    });
  });
});

describe('buildObfuscatedFieldsFilter copies', () => {
  it('does not modify its input', () => {
    const filter = buildObfuscatedFieldsFilter();
    const work = {
      input: { token: 'plain', nested: [{ password: 'secret' }] },
      result: { accessToken: 'abc' },
    };
    const snapshot = structuredClone(work);

    const result = filter(work);

    assert.deepStrictEqual(work, snapshot);
    assert.notStrictEqual(result, work);
    assert.notStrictEqual(result.input.nested, work.input.nested);
    assert.strictEqual(result.input.token, '******');
    assert.strictEqual(result.input.nested[0].password, '******');
    assert.strictEqual(result.result.accessToken, '******');
  });

  it('keeps dates, buffers and class instances as they are', () => {
    class Credentials {
      token = 'inside-an-instance';
    }
    const created = new Date('2026-11-04T10:00:00.000Z');
    const buffer = Buffer.from('data');
    const credentials = new Credentials();
    const filter = buildObfuscatedFieldsFilter();

    const result = filter({ created, buffer, credentials, items: [created] });

    assert.strictEqual(result.created, created);
    assert.strictEqual(result.buffer, buffer);
    assert.strictEqual(result.credentials, credentials);
    assert.strictEqual(result.items[0], created);
    assert.strictEqual(credentials.token, 'inside-an-instance');
  });

  it('masks a non-plain value of a sensitive key', () => {
    const filter = buildObfuscatedFieldsFilter();
    const result = filter({ token: ['a', 'b'], secret: new Date(), password: null });
    assert.deepStrictEqual(result, { token: '******', secret: '******', password: '******' });
  });

  it('filters a plain object under a sensitive key instead of masking it', () => {
    const filter = buildObfuscatedFieldsFilter();
    const input = {
      token: { _id: 'token-1', walletAddress: '0x1', meta: { accessKey: 'key' } },
      recipientWalletAddress: '0x2',
    };

    const result = filter(input);

    assert.deepStrictEqual(result, {
      token: { _id: 'token-1', walletAddress: '0x1', meta: { accessKey: '******' } },
      recipientWalletAddress: '0x2',
    });
    assert.strictEqual(input.token.meta.accessKey, 'key');
  });

  it('filters objects without a prototype', () => {
    const filter = buildObfuscatedFieldsFilter();
    const data = Object.assign(Object.create(null), { token: 'a', name: 'b' });
    assert.deepStrictEqual({ ...filter(data) }, { token: '******', name: 'b' });
  });

  it('keeps a "__proto__" key as an own property of the copy', () => {
    const filter = buildObfuscatedFieldsFilter();
    const data = JSON.parse('{"__proto__": {"polluted": true, "token": "a"}, "name": "b"}');

    const result = filter(data);

    assert.strictEqual(Object.getPrototypeOf(result), Object.prototype);
    assert.strictEqual(result.polluted, undefined);
    assert.deepStrictEqual(Object.getOwnPropertyDescriptor(result, '__proto__')?.value, {
      polluted: true,
      token: '******',
    });
    assert.strictEqual(({} as any).polluted, undefined);
  });
});
