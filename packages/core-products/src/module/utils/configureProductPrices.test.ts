import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getDecimals, normalizeRate } from '../configureProductPrices.js';

describe('Rate conversion', () => {
  it('getDecimals', () => {
    assert.strictEqual(getDecimals(18), 9);
    assert.strictEqual(getDecimals(8), 8);
    assert.strictEqual(getDecimals(1), 1);
    assert.strictEqual(getDecimals(null), 2);
    assert.strictEqual(getDecimals(undefined), 2);
    assert.strictEqual(getDecimals(0), 0);
  });

  it('normalizeRate converting between FIAT with 2 decimals', () => {
    assert.strictEqual(
      normalizeRate(
        {
          isoCode: 'USD',
          decimals: 2,
        } as any,
        {
          isoCode: 'CHF',
          decimals: 2,
        } as any,
        { quoteCurrency: 'USD', rate: 0.9 } as any,
      ),
      1.1111111111111112,
    );

    assert.strictEqual(
      normalizeRate(
        {
          isoCode: 'CHF', // in Rappen
          decimals: 2,
        } as any,
        {
          isoCode: 'USD', // in Pennies
          decimals: 2,
        } as any,
        { quoteCurrency: 'USD', rate: 0.9 } as any,
      ),
      0.9,
    );
  });

  it('normalizeRate converting between FIAT with 0 and 2 decimals', () => {
    assert.strictEqual(
      normalizeRate(
        {
          isoCode: 'CLP', // in Pesos
          decimals: 0,
        } as any,
        {
          isoCode: 'CHF', // in Rappen
          decimals: 2,
        } as any,
        { baseCurrency: 'CLP', quoteCurrency: 'CHF', rate: 0.0010451376 } as any,
      ),
      0.10451376,
    );

    assert.strictEqual(
      normalizeRate(
        {
          isoCode: 'CLP', // in Pesos
          decimals: 0,
        } as any,
        {
          isoCode: 'CHF', // in Rappen
          decimals: 2,
        } as any,
        {
          baseCurrency: 'CHF',
          quoteCurrency: 'CLP',
          rate: 956.75994,
          expiresAt: undefined,
          timestamp: undefined,
        },
      ),
      0.10451942626276765,
    );
  });

  it('normalizeRate converting FIAT to/from Crypto with Crypto->Fiat Pair', () => {
    assert.strictEqual(
      normalizeRate(
        {
          isoCode: 'USD', // in Pennies
          decimals: 2,
        } as any,
        {
          isoCode: 'BTC', // In Satoshis
          decimals: 9,
        } as any,
        { baseCurrency: 'BTC', quoteCurrency: 'USD', rate: 19284.61 } as any,
      ),
      518.5482102049251,
    );

    assert.strictEqual(
      normalizeRate(
        {
          isoCode: 'ETH', // in GWEI
          decimals: 18,
        } as any,
        {
          isoCode: 'CHF', // in Rappen
          decimals: 2,
        } as any,
        { baseCurrency: 'ETH', quoteCurrency: 'CHF', rate: 1311.63 } as any,
      ),
      0.000131163,
    );

    // 1 ETH = 0.000131163
  });

  it('normalizeRate converting FIAT to/from Crypto with Fiat->Crypto Pair', () => {
    assert.strictEqual(
      normalizeRate(
        {
          isoCode: 'USD', // in Pennies
          decimals: 2,
        } as any,
        {
          isoCode: 'BTC', // in Satoshis
          decimals: 8,
        } as any,
        { baseCurrency: 'USD', quoteCurrency: 'BTC', rate: 0.000052 } as any,
      ),
      52,
    );

    // 1 USD = 100 Pennies
    // 100 Pennies = 5200 Satoshis

    assert.strictEqual(
      normalizeRate(
        {
          isoCode: 'ETH', // in GWEI
          decimals: 18,
        } as any,
        {
          isoCode: 'CLP', // in Pesos
          decimals: 0,
        } as any,
        { baseCurrency: 'CLP', quoteCurrency: 'ETH', rate: 0.000000794 } as any,
      ),
      0.0012594458438287153,
    );

    // 1 ETH = 1,000,000,000 GWEI (10^9)
    // 1,000,000,000 GWEI = 1’259’445 CLP
  });
});
