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
        _id: '3e94daeb7a9600e9bb07b50c92c21ac9002da34a2d8fe799a6ce885404b545b9',
        isTaxable: false,
        isNetPrice: false,
        amount: 750,
        currencyCode: 'CHF',
      },
      maxPrice: {
        _id: 'b6a9702eb217f07ad5fa8c3a378e072d49b667813db0e127fab7cf5e2c4b2639',
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
        _id: '00f750fe893f9f5e04c31a6a6f1a60f5d941182e388b7908a02e5bc855d16797',
        isTaxable: false,
        isNetPrice: false,
        amount: NaN,
        currencyCode: undefined,
      },
      maxPrice: {
        _id: '00f750fe893f9f5e04c31a6a6f1a60f5d941182e388b7908a02e5bc855d16797',
        isTaxable: false,
        isNetPrice: false,
        amount: NaN,
        currencyCode: undefined,
      },
    });
  });
});
