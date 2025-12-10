import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getPriceRange } from './getPriceRange.ts';
import product from '../../mock/product.ts';
import { getPriceLevels } from './getPriceLevels.ts';

describe('Price Range', () => {
  it('Should return the minimum and maximum price of a product when there are multiple prices', () => {
    assert.deepStrictEqual(
      getPriceRange({
        productId: product._id,
        prices: getPriceLevels({ product, countryCode: 'CH', currencyCode: 'CHF' } as any),
      }),
      {
        minPrice: {
          isTaxable: false,
          isNetPrice: false,
          amount: 750,
          currencyCode: 'CHF',
          countryCode: 'CH',
        },
        maxPrice: {
          isTaxable: false,
          isNetPrice: false,
          amount: 1000,
          currencyCode: 'CHF',
          countryCode: 'CH',
        },
      },
    );
  });

  it('Should still return and object with min and max price field when no price list is provided', () => {
    assert.deepStrictEqual(
      getPriceRange({
        productId: product._id,
        prices: getPriceLevels({ product, countryCode: 'DE', currencyCode: 'EUR' } as any),
      }),
      {
        minPrice: {
          isTaxable: false,
          isNetPrice: false,
          amount: NaN,
          currencyCode: undefined,
          countryCode: undefined,
        },
        maxPrice: {
          isTaxable: false,
          isNetPrice: false,
          amount: NaN,
          currencyCode: undefined,
          countryCode: undefined,
        },
      },
    );
  });
});
