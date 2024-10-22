import { getDecimals, normalizeRate } from '../configureProductPrices.js';

describe('Rate conversion', () => {
  it('getDecimals', () => {
    expect(getDecimals(18)).toBe(9);
    expect(getDecimals(8)).toBe(8);
    expect(getDecimals(1)).toBe(1);
    expect(getDecimals(null)).toBe(2);
    expect(getDecimals(undefined)).toBe(2);
    expect(getDecimals(0)).toBe(0);
  });

  it('normalizeRate converting between FIAT with 2 decimals', () => {
    expect(
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
    ).toBe(1.1111111111111112);

    expect(
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
    ).toBe(0.9);
  });

  it('normalizeRate converting between FIAT with 0 and 2 decimals', () => {
    expect(
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
    ).toBe(0.10451376);

    expect(
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
    ).toBe(0.10451942626276765);
  });

  it('normalizeRate converting FIAT to/from Crypto with Crypto->Fiat Pair', () => {
    expect(
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
    ).toBe(518.5482102049251);

    expect(
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
    ).toBe(0.000131163);

    // 1 ETH = 0.000131163
  });

  it('normalizeRate converting FIAT to/from Crypto with Fiat->Crypto Pair', () => {
    expect(
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
    ).toBe(52);

    // 1 USD = 100 Pennies
    // 100 Pennies = 5200 Satoshis

    expect(
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
    ).toBe(0.0012594458438287153);

    // 1 ETH = 1,000,000,000 GWEI (10^9)
    // 1,000,000,000 GWEI = 1’259’445 CLP
  });
});
