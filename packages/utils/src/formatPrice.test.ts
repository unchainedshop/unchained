import assert from 'node:assert/strict';
import { it } from 'node:test';
import { formatPrice } from './formatPrice.ts';

it('uses the configured currency precision for both the stored amount and its display', () => {
  assert.equal(
    formatPrice({ amount: 1050, currencyCode: 'JPY', locale: 'en-US', decimals: 0 }),
    'JPY 1,050',
  );
  assert.equal(
    formatPrice({ amount: 1050, currencyCode: 'CHF', locale: 'de-CH', decimals: 3 }),
    'CHF 1.050',
  );
  assert.equal(
    formatPrice({ amount: 1050, currencyCode: 'TOKEN', locale: 'de-DE', decimals: 9 }),
    'TOKEN 0,000001050',
  );
  assert.equal(
    formatPrice({ amount: 1_500_000_000, currencyCode: 'ETH', locale: 'de-CH', decimals: 18 }),
    'ETH 1.500000000',
  );
  assert.equal(
    formatPrice({ amount: 123, currencyCode: 'CHF', locale: 'de-DE', decimals: -1 }),
    '1.230 CHF',
  );
});
