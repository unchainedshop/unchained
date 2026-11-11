import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { isValidAppleIAPSharedSecret, assertTransactionId } from './shared-secret.ts';

describe('isValidAppleIAPSharedSecret', () => {
  const original = process.env.APPLE_IAP_SHARED_SECRET;

  beforeEach(() => {
    process.env.APPLE_IAP_SHARED_SECRET = 'the-configured-secret';
  });

  afterEach(() => {
    if (original === undefined) delete process.env.APPLE_IAP_SHARED_SECRET;
    else process.env.APPLE_IAP_SHARED_SECRET = original;
  });

  it('accepts the configured secret', async () => {
    assert.strictEqual(await isValidAppleIAPSharedSecret('the-configured-secret'), true);
  });

  it('rejects a wrong secret', async () => {
    assert.strictEqual(await isValidAppleIAPSharedSecret('nope'), false);
  });

  it('rejects a missing password field', async () => {
    assert.strictEqual(await isValidAppleIAPSharedSecret(undefined), false);
  });

  it('fails closed when the shared secret is not configured', async () => {
    delete process.env.APPLE_IAP_SHARED_SECRET;
    assert.strictEqual(await isValidAppleIAPSharedSecret(undefined), false);
    assert.strictEqual(await isValidAppleIAPSharedSecret(''), false);
  });
});

describe('assertTransactionId', () => {
  it('passes a non-empty string through', () => {
    assert.strictEqual(assertTransactionId('1000000'), '1000000');
  });

  it('rejects non-strings and empty strings', () => {
    assert.throws(() => assertTransactionId({ $gt: '' }), /non-empty string/);
    assert.throws(() => assertTransactionId(undefined), /non-empty string/);
    assert.throws(() => assertTransactionId(''), /non-empty string/);
  });
});
