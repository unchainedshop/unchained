import { describe, it } from 'node:test';
import assert from 'node:assert';
import { priceToString } from './priceToString.ts';

// Intl.NumberFormat separates the currency code from the amount with a
// non-breaking space (U+00A0)
const NBSP = ' ';

describe('priceToString', () => {
  it('should format price in cents to currency string', () => {
    assert.strictEqual(priceToString({ amount: 1000, currencyCode: 'CHF' }), `CHF${NBSP}10.00`);
  });

  it('should handle decimal amounts', () => {
    assert.strictEqual(priceToString({ amount: 1050, currencyCode: 'EUR' }), `EUR${NBSP}10.50`);
  });

  it('should handle zero', () => {
    assert.strictEqual(priceToString({ amount: 0, currencyCode: 'USD' }), `USD${NBSP}0.00`);
  });

  it('should format according to the given locale', () => {
    assert.strictEqual(
      priceToString({ amount: 123456, currencyCode: 'EUR', locale: 'de-DE' }),
      `1.234,56${NBSP}EUR`,
    );
    assert.strictEqual(
      priceToString({ amount: 123456, currencyCode: 'CHF', locale: new Intl.Locale('de-CH') }),
      `CHF${NBSP}1'234.56`,
    );
  });

  it('should fall back to plain concatenation for non-ISO currency codes', () => {
    assert.strictEqual(priceToString({ amount: 1050, currencyCode: 'SHRDLU' }), 'SHRDLU 10.5');
  });
});
