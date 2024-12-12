import { getPriceRange } from './getPriceRange.js';
import product from '../../mock/product.js';
import { getPriceLevels } from './getPriceLevels.js';

describe('Price Range', () => {
  it('Should return the minimum and maximum price of a product when there are multiple prices', () => {
    expect(
      getPriceRange({
        productId: product._id,
        prices: getPriceLevels({ product, countryCode: 'CH', currencyCode: 'CHF' } as any),
      }),
    ).toEqual({
      minPrice: {
        isTaxable: false,
        isNetPrice: false,
        amount: 750,
        currencyCode: 'CHF',
      },
      maxPrice: {
        isTaxable: false,
        isNetPrice: false,
        amount: 1000,
        currencyCode: 'CHF',
      },
    });
  });

  it('Should still return and object with min and max price field when no price list is provided', () => {
    expect(
      getPriceRange({
        productId: product._id,
        prices: getPriceLevels({ product, countryCode: 'DE', currencyCode: 'EUR' } as any),
      }),
    ).toEqual({
      minPrice: {
        isTaxable: false,
        isNetPrice: false,
        amount: NaN,
        currencyCode: undefined,
      },
      maxPrice: {
        isTaxable: false,
        isNetPrice: false,
        amount: NaN,
        currencyCode: undefined,
      },
    });
  });
});
