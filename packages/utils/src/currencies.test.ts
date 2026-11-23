import { describe, it } from 'node:test';
import assert from 'node:assert';
import { currencyDecimals } from './currency-decimals.ts';
import { isoCurrencyDecimals } from './currencies.ts';

describe('currencies', () => {
  it('currencyDecimals defaults to 2 and stores at most 9', () => {
    assert.deepStrictEqual(
      [undefined, null, 0, 1, 2, 3, 8, 9, 18].map((decimals) => currencyDecimals(decimals)),
      [2, 2, 0, 1, 2, 3, 8, 9, 9],
    );
  });

  it('isoCurrencyDecimals returns the ISO 4217 minor unit and nothing for other codes', () => {
    assert.deepStrictEqual(
      ['JPY', 'krw', 'CHF', 'HUF', 'IDR', 'KWD', 'BTC', 'MATIC'].map((code) =>
        isoCurrencyDecimals(code),
      ),
      [0, 0, 2, 2, 2, 3, undefined, undefined],
    );
  });
});
