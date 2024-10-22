import { getPriceLevels } from './getPriceLevels.js';
import product from '../../mock/product.js';

describe('Price level', () => {
  it('Should return empty array when country code is not specified', () => {
    expect(getPriceLevels({ product, currencyCode: 'CHF' } as any)).toHaveLength(0);
  });

  it('Should return empty array when country code is not specified', () => {
    expect(getPriceLevels({ product, countryCode: 'ET' } as any)).toHaveLength(1);
    expect(getPriceLevels({ product, countryCode: 'ET' } as any)).toEqual([
      {
        amount: 20000,
        maxQuantity: 2,
        isTaxable: true,
        isNetPrice: true,
        currencyCode: 'ETB',
        countryCode: 'ET',
      },
    ]);
    expect(getPriceLevels({ product, countryCode: 'CH' } as any)).toHaveLength(3);
    expect(getPriceLevels({ product, countryCode: 'CH' } as any)).toEqual([
      {
        amount: 1000,
        maxQuantity: null,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
      {
        amount: 1,
        maxQuantity: 1,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'ETH',
        countryCode: 'CH',
      },
      {
        amount: 750,
        maxQuantity: 2,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
    ]);
  });

  it('Should return all prices for a given country sorted by max quantity ASC', () => {
    expect(getPriceLevels({ product, countryCode: 'CH' } as any)).toEqual([
      {
        amount: 1000,
        maxQuantity: null,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
      {
        amount: 1,
        maxQuantity: 1,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'ETH',
        countryCode: 'CH',
      },
      {
        amount: 750,
        maxQuantity: 2,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
    ]);
  });

  it('Should return all prices currencyCode', () => {
    expect(getPriceLevels({ product, countryCode: 'CH', currencyCode: 'CHF' } as any)).toHaveLength(2);
    expect(getPriceLevels({ product, countryCode: 'CH', currencyCode: 'ETH' } as any)).toHaveLength(1);
  });
});
