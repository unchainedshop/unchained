import { describe, it } from 'node:test';
import assert from 'node:assert';

import { normalizePhoneNumber, phoneNumberToParts } from './phone-number.ts';

describe('normalizePhoneNumber', () => {
  it('passes through a valid E.164 number', () => {
    assert.strictEqual(normalizePhoneNumber('+41791234567'), '+41791234567');
  });

  it('normalizes a national number using the default country', () => {
    assert.strictEqual(normalizePhoneNumber('079 123 45 67', 'CH'), '+41791234567');
  });

  it('normalizes a 00-prefixed international number given a default country', () => {
    // "00" is the international call prefix only in some regions, so a default
    // country is required to interpret it.
    assert.strictEqual(normalizePhoneNumber('0041791234567', 'CH'), '+41791234567');
  });

  it('strips spaces, dashes and parentheses', () => {
    assert.strictEqual(normalizePhoneNumber('+1 (415) 555-2671'), '+14155552671');
  });

  it('returns undefined for empty input', () => {
    assert.strictEqual(normalizePhoneNumber(undefined), undefined);
    assert.strictEqual(normalizePhoneNumber(''), undefined);
    assert.strictEqual(normalizePhoneNumber(null), undefined);
  });

  it('returns undefined for an invalid number', () => {
    assert.strictEqual(normalizePhoneNumber('not-a-phone'), undefined);
    assert.strictEqual(normalizePhoneNumber('12'), undefined);
  });

  it('returns undefined for a national number without a default country', () => {
    assert.strictEqual(normalizePhoneNumber('079 123 45 67'), undefined);
  });
});

describe('phoneNumberToParts', () => {
  it('splits a valid E.164 number into cc and subscriber', () => {
    assert.deepStrictEqual(phoneNumberToParts('+41791234567'), {
      cc: '41',
      subscriber: '791234567',
    });
  });

  it('splits a national number using the default country', () => {
    assert.deepStrictEqual(phoneNumberToParts('079 123 45 67', 'CH'), {
      cc: '41',
      subscriber: '791234567',
    });
  });

  it('returns undefined for empty or invalid input', () => {
    assert.strictEqual(phoneNumberToParts(undefined), undefined);
    assert.strictEqual(phoneNumberToParts('not-a-phone'), undefined);
  });
});
