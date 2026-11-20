import assert from 'node:assert/strict';
import { it } from 'node:test';
import { formatPrice } from './formatPrice.ts';

for (const [currencyCode, locale, decimals, amount, expected] of [
  ['JPY', 'en-US', 0, 1050, 'JPY 1,050'],
  ['JPY', 'en-US', null, 1050, 'JPY 11'],
  ['CHF', 'de-CH', 3, 1050, 'CHF 1.050'],
  ['TOKEN', 'de-DE', 9, 1050, 'TOKEN 0,000001050'],
  ['ETH', 'de-CH', 18, 1_500_000_000, 'ETH 1.500000000'],
  ['CHF', 'de-DE', -1, 123, '1.230 CHF'],
] as const) {
  it(`formats ${currencyCode} with a configured scale of ${decimals} in ${locale}`, () => {
    assert.equal(formatPrice({ amount, currencyCode, locale, decimals }), expected);
  });
}
