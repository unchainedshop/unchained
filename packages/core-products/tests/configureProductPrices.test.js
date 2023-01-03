import { getDecimals, normalizeRate } from '../lib/module/configureProductPrices.js';
import { getPriceLevels } from '../lib/module/utils/getPriceLevels.js';
import { getPriceRange } from '../lib/module/utils/getPriceRange.js';
import product from './mock/product'

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

describe('Price level', () => {
  it('Should return empty array when country code is not specified', () => {
    expect(getPriceLevels({product,  currencyCode: "CHF"})).toHaveLength(0)
  })

  it('Should return empty array when country code is not specified', () => {
    expect(getPriceLevels({product,  countryCode: "ET"})).toHaveLength(1)
    expect(getPriceLevels({product,  countryCode: "ET"})).toEqual([
      {
        amount: 20000,
        maxQuantity: 2,
        isTaxable: true,
        isNetPrice: true,
        currencyCode: 'ETB',
        countryCode: 'ET'
      }
    ])
    expect(getPriceLevels({product,  countryCode: "CH"})).toHaveLength(3)
    expect(getPriceLevels({product,  countryCode: "CH"})).toEqual([
      {
        amount: 1000,
        maxQuantity: null,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH'
      },
      {
        amount: 1,
        maxQuantity: 1,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'ETH',
        countryCode: 'CH'
      },
      {
        amount: 750,
        maxQuantity: 2,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH'
      }
    ])
  })


  it('Should return all prices for a given country sorted by max quantity ASC', () => {
    expect(getPriceLevels({product,  countryCode: "CH"})).toEqual([
      {
        amount: 1000,
        maxQuantity: null,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH'
      },
      {
        amount: 1,
        maxQuantity: 1,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'ETH',
        countryCode: 'CH'
      },
      {
        amount: 750,
        maxQuantity: 2,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH'
      }
    ])
  })

  it('Should return all prices currencyCode', () => {
    expect(getPriceLevels({product,  countryCode: "CH", currencyCode: "CHF"})).toHaveLength(2)
    expect(getPriceLevels({product,  countryCode: "CH", currencyCode: "ETH"})).toHaveLength(1)
    
  })
})



describe('Price Range', () => {
  it('Should return the minimum and maximum price of a product when there are multiple prices', () => {
    expect(getPriceRange({productId: product._id, prices: getPriceLevels({product, countryCode: "CH", currencyCode: "CHF"}) })).toEqual({
      minPrice: {
        _id: '3e94daeb7a9600e9bb07b50c92c21ac9002da34a2d8fe799a6ce885404b545b9',
        isTaxable: false,
        isNetPrice: false,
        amount: 750,
        currencyCode: 'CHF'
      },
      maxPrice: {
        _id: 'b6a9702eb217f07ad5fa8c3a378e072d49b667813db0e127fab7cf5e2c4b2639',
        isTaxable: false,
        isNetPrice: false,
        amount: 1000,
        currencyCode: 'CHF'
      }
    })
  })

  it('Should return the same price as minimum and maximum when only one price exist for a given currency', () => {
    expect(getPriceRange({productId: product._id, prices: getPriceLevels({product, countryCode: "ET", currencyCode: "ETB"}) })).toEqual({
      minPrice: {
        _id: '1740965265959af6ecda7cc3e06454069d6ed4e21ae052791ab172a342c82fa0',
        isTaxable: true,
        isNetPrice: true,
        amount: 20000,
        currencyCode: 'ETB'
      },
      maxPrice: {
        _id: '1740965265959af6ecda7cc3e06454069d6ed4e21ae052791ab172a342c82fa0',
        isTaxable: true,
        isNetPrice: true,
        amount: 20000,
        currencyCode: 'ETB'
      }
    })
  })

  it('Should still return and object with min and max price field when no price list is provided', () => {

    
    expect(getPriceRange({productId: product._id, prices: getPriceLevels({product, countryCode: "DE", currencyCode: "EUR"}) })).toEqual({
      minPrice: {
        _id: '00f750fe893f9f5e04c31a6a6f1a60f5d941182e388b7908a02e5bc855d16797',
        isTaxable: false,
        isNetPrice: false,
        amount: NaN,
        currencyCode: undefined
      },
      maxPrice: {
        _id: '00f750fe893f9f5e04c31a6a6f1a60f5d941182e388b7908a02e5bc855d16797',
        isTaxable: false,
        isNetPrice: false,
        amount: NaN,
        currencyCode: undefined
      }
    })
  })

  it('Should return empty array when country code is not specified', () => {
    expect(getPriceLevels({product,  countryCode: "ET"})).toHaveLength(1)
    expect(getPriceLevels({product,  countryCode: "ET"})).toEqual([
      {
        amount: 20000,
        maxQuantity: 2,
        isTaxable: true,
        isNetPrice: true,
        currencyCode: 'ETB',
        countryCode: 'ET'
      }
    ])
    expect(getPriceLevels({product,  countryCode: "CH"})).toHaveLength(3)
    expect(getPriceLevels({product,  countryCode: "CH"})).toEqual([
      {
        amount: 1000,
        maxQuantity: null,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH'
      },
      {
        amount: 1,
        maxQuantity: 1,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'ETH',
        countryCode: 'CH'
      },
      {
        amount: 750,
        maxQuantity: 2,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH'
      }
    ])
  })


  it('Should return all prices for a given country sorted by max quantity ASC', () => {
    expect(getPriceLevels({product,  countryCode: "CH"})).toEqual([
      {
        amount: 1000,
        maxQuantity: null,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH'
      },
      {
        amount: 1,
        maxQuantity: 1,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'ETH',
        countryCode: 'CH'
      },
      {
        amount: 750,
        maxQuantity: 2,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH'
      }
    ])
  })

  it('Should return all prices currencyCode', () => {
    expect(getPriceLevels({product,  countryCode: "CH", currencyCode: "CHF"})).toHaveLength(2)
    expect(getPriceLevels({product,  countryCode: "CH", currencyCode: "ETH"})).toHaveLength(1)
    
  })
})