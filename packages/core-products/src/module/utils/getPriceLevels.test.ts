import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getPriceLevels } from './getPriceLevels.ts';
import product from '../../mock/product.ts';

describe('Price level', () => {
  it('Should return empty array when country code is not specified', () => {
    assert.strictEqual(getPriceLevels({ product, currencyCode: 'CHF' } as any).length, 0);
  });

  it('Should return empty array when country code is not specified', () => {
    assert.strictEqual(getPriceLevels({ product, countryCode: 'ET' } as any).length, 2);

    assert.deepStrictEqual(getPriceLevels({ product, countryCode: 'ET' } as any), [
      {
        amount: 20000,
        minQuantity: 1,
        isTaxable: true,
        isNetPrice: true,
        currencyCode: 'ETB',
        countryCode: 'ET',
      },
      {
        amount: 18000,
        minQuantity: 3,
        isTaxable: true,
        isNetPrice: true,
        currencyCode: 'ETB',
        countryCode: 'ET',
      },
    ]);
    assert.strictEqual(getPriceLevels({ product, countryCode: 'CH' } as any).length, 5);
    assert.deepStrictEqual(getPriceLevels({ product, countryCode: 'CH' } as any), [
      {
        amount: 1000,
        minQuantity: null,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
      {
        amount: 0.01,
        minQuantity: 1,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'ETH',
        countryCode: 'CH',
      },
      {
        amount: 900,
        minQuantity: 2,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
      {
        amount: 0.009,
        minQuantity: 2,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'ETH',
        countryCode: 'CH',
      },
      {
        amount: 800,
        minQuantity: 5,
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
        amount: 1000,
        minQuantity: null,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
      {
        amount: 0.01,
        minQuantity: 1,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'ETH',
        countryCode: 'CH',
      },
      {
        amount: 900,
        minQuantity: 2,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
      {
        amount: 0.009,
        minQuantity: 2,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'ETH',
        countryCode: 'CH',
      },
      {
        amount: 800,
        minQuantity: 5,
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
      3,
    );
    assert.strictEqual(
      getPriceLevels({ product, countryCode: 'CH', currencyCode: 'ETH' } as any).length,
      2,
    );
  });
});
