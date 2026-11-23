import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatAmount } from './format-amount.ts';

const NBSP = '\u00a0';

describe('formatAmount', () => {
  it('shows the decimals of the currency', () => {
    assert.deepStrictEqual(
      [
        { amount: 5900, currencyCode: 'JPY', decimals: 0 },
        { amount: 12345, currencyCode: 'KWD', decimals: 3 },
        { amount: 150000, currencyCode: 'BTC', decimals: 8 },
        { amount: 1000000000, currencyCode: 'MATIC', decimals: 9 },
      ].map((price) => formatAmount({ ...price, locale: 'en-US' })),
      [`¥5,900`, `KWD${NBSP}12.345`, `BTC${NBSP}0.00150000`, 'MATIC 1.000000000'],
    );
  });

  it('formats for the locale and can show the currency code', () => {
    assert.strictEqual(
      formatAmount({
        amount: 123456,
        currencyCode: 'CHF',
        decimals: 2,
        locale: new Intl.Locale('de-CH'),
        currencyDisplay: 'code',
      }),
      `CHF${NBSP}1'234.56`,
    );
  });
});
