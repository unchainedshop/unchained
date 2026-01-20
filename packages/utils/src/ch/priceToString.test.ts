import { describe, it } from 'node:test';
import assert from 'node:assert';
import { priceToString } from './priceToString.ts';

describe('priceToString', () => {
  it('should format price in cents to currency string', () => {
    assert.strictEqual(priceToString({ amount: 1000, currencyCode: 'CHF' }), 'CHF 10');
  });

  it('should handle decimal amounts', () => {
    assert.strictEqual(priceToString({ amount: 1050, currencyCode: 'EUR' }), 'EUR 10.5');
  });

  it('should handle zero', () => {
    assert.strictEqual(priceToString({ amount: 0, currencyCode: 'USD' }), 'USD 0');
  });
});
