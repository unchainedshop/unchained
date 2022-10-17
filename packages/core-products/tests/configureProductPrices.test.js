import { getDecimals, normalizeRate } from '../src/module/configureProductPrices';

describe('Rate conversion', () => {
  test('getDecimals', () => {
    expect(getDecimals(18)).toBe(9);
    expect(getDecimals(8)).toBe(8);
    expect(getDecimals(1)).toBe(1);
    expect(getDecimals(null)).toBe(2);
    expect(getDecimals(undefined)).toBe(2);
    expect(getDecimals(0)).toBe(0);
  });

  test('normalizeRate converting between FIAT with 2 decimals', () => {
    expect(normalizeRate({
      isoCode: "USD",
      decimals: 2
    }, {
      isoCode: "CHF",
      decimals: 2
    }, { quoteCurrency: "USD", rate: 0.9})).toBe(1.1111111111111112);

    expect(normalizeRate({
      isoCode: "CHF", // in Rappen
      decimals: 2
    }, {
      isoCode: "USD", // in Pennies
      decimals: 2
    }, { quoteCurrency: "USD", rate: 0.9})).toBe(0.9);
  });

  test('normalizeRate converting between FIAT with 0 and 2 decimals', () => {
    expect(normalizeRate({
      isoCode: "CLP", // in Pesos
      decimals: 0
    }, {
      isoCode: "CHF", // in Rappen
      decimals: 2
    }, { baseCurrency: "CLP", quoteCurrency: "CHF", rate: 0.0010451376})).toBe(0.10451376);

    expect(normalizeRate({
      isoCode: "CLP", // in Pesos
      decimals: 0
    }, {
      isoCode: "CHF", // in Rappen
      decimals: 2
    }, { baseCurrency: "CHF", quoteCurrency: "CLP", rate: 956.75994})).toBe(0.10451942626276765);
  });

  test('normalizeRate converting FIAT to/from Crypto with Crypto->Fiat Pair', () => {
    expect(normalizeRate({
      isoCode: "USD", // in Pennies
      decimals: 2
    }, {
      isoCode: "BTC", // In Satoshis
      decimals: 9
    }, { baseCurrency: "BTC", quoteCurrency: "USD", rate: 19284.61})).toBe(518.5482102049251);

    expect(normalizeRate({
      isoCode: "ETH", // in GWEI
      decimals: 18
    }, {
      isoCode: "CHF", // in Rappen
      decimals: 2
    }, { baseCurrency: "ETH", quoteCurrency: "CHF", rate: 1311.63})).toBe(0.000131163);

    // 1 ETH = 0.000131163
  });

  test('normalizeRate converting FIAT to/from Crypto with Fiat->Crypto Pair', () => {
    expect(normalizeRate({
      isoCode: "USD", // in Pennies
      decimals: 2
    }, {
      isoCode: "BTC", // in Satoshis
      decimals: 8
    }, { baseCurrency: "USD", quoteCurrency: "BTC", rate: 0.000052})).toBe(52);

    // 1 USD = 100 Pennies
    // 100 Pennies = 5200 Satoshis

    expect(normalizeRate({
      isoCode: "ETH", // in GWEI
      decimals: 18
    }, {
      isoCode: "CLP", // in Pesos
      decimals: 0
    }, { baseCurrency: "CLP", quoteCurrency: "ETH", rate: 0.000000794})).toBe(0.0012594458438287153);
    
    // 1 ETH = 1,000,000,000 GWEI (10^9)
    // 1,000,000,000 GWEI = 1’259’445 CLP
  });
});