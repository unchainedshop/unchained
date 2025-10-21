import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getPriceLevels } from './getPriceLevels.js';
import product from '../../mock/product.js';

describe('Price level', () => {
  it('Should return empty array when country code is not specified', () => {
    assert.strictEqual(getPriceLevels({ product, currencyCode: 'CHF' } as any).length, 0);
  });

  it('Should return empty array when country code is not specified', () => {
    assert.strictEqual(getPriceLevels({ product, countryCode: 'ET' } as any).length, 1);
    assert.deepStrictEqual(getPriceLevels({ product, countryCode: 'ET' } as any), [
      {
        amount: 20000,
        maxQuantity: 2,
        isTaxable: true,
        isNetPrice: true,
        currencyCode: 'ETB',
        countryCode: 'ET',
      },
    ]);
    assert.strictEqual(getPriceLevels({ product, countryCode: 'CH' } as any).length, 3);
    assert.deepStrictEqual(getPriceLevels({ product, countryCode: 'CH' } as any), [
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
      {
        amount: 1000,
        maxQuantity: null,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
    ]);
  });

  it('Should return all prices for a given country sorted by max quantity ASC', () => {
    assert.deepStrictEqual(getPriceLevels({ product, countryCode: 'CH' } as any), [
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
      {
        amount: 1000,
        maxQuantity: null,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
    ]);
  });

  it('Should return all prices currencyCode', () => {
    assert.strictEqual(
      getPriceLevels({ product, countryCode: 'CH', currencyCode: 'CHF' } as any).length,
      2,
    );
    assert.strictEqual(
      getPriceLevels({ product, countryCode: 'CH', currencyCode: 'ETH' } as any).length,
      1,
    );
  });
});
