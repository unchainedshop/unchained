import { describe, it } from 'node:test';
import assert from 'node:assert';
import { addressToString } from './addressToString.ts';

describe('addressToString', () => {
  it('should format a complete address', () => {
    const address = {
      firstName: 'John',
      lastName: 'Doe',
      company: 'ACME Inc',
      addressLine: 'Main Street 1',
      addressLine2: 'Apt 5',
      postalCode: '8001',
      city: 'Zurich',
      regionCode: 'ZH',
      countryCode: 'CH',
    };
    const result = addressToString(address);
    assert.strictEqual(result, 'John Doe\nACME Inc\nMain Street 1\nApt 5\n8001 Zurich\nZH\nCH');
  });

  it('should handle undefined address', () => {
    assert.strictEqual(addressToString(undefined), '');
  });

  it('should handle partial address', () => {
    const address = { city: 'Zurich', countryCode: 'CH' };
    const result = addressToString(address);
    assert.strictEqual(result, 'Zurich\nCH');
  });

  it('should skip undefined fields', () => {
    const address = { firstName: 'John', city: 'Zurich' };
    const result = addressToString(address);
    assert.strictEqual(result, 'John\nZurich');
  });
});
