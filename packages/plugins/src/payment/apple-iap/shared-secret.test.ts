import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { assertAppleIAPSharedSecret, assertTransactionId } from './shared-secret.ts';

describe('assertAppleIAPSharedSecret', () => {
  const original = process.env.APPLE_IAP_SHARED_SECRET;

  beforeEach(() => {
    process.env.APPLE_IAP_SHARED_SECRET = 'the-configured-secret';
  });

  afterEach(() => {
    if (original === undefined) delete process.env.APPLE_IAP_SHARED_SECRET;
    else process.env.APPLE_IAP_SHARED_SECRET = original;
  });

  it('accepts the configured secret', async () => {
    await assertAppleIAPSharedSecret('the-configured-secret');
  });

  it('rejects a wrong secret', async () => {
    await assert.rejects(() => assertAppleIAPSharedSecret('nope'), /shared secret not valid/);
  });

  it('rejects a missing password field', async () => {
    await assert.rejects(() => assertAppleIAPSharedSecret(undefined), /shared secret not valid/);
  });

  it('fails closed when the shared secret is not configured', async () => {
    delete process.env.APPLE_IAP_SHARED_SECRET;
    await assert.rejects(() => assertAppleIAPSharedSecret(undefined), /not configured/);
    await assert.rejects(() => assertAppleIAPSharedSecret(''), /not configured/);
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
