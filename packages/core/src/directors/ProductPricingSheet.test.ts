import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import { ProductPricingSheet } from './ProductPricingSheet.js';

const TAX = { category: 'TAX', amount: 50, isNetPrice: false, isTaxable: false };
const TAX2 = { category: 'TAX', amount: 25, isNetPrice: false, isTaxable: false };
const DISCOUNT = {
  category: 'DISCOUNT',
  amount: 20,
  isNetPrice: false,
  isTaxable: false,
  discountId: 'for-all',
};
const DISCOUNT2 = {
  category: 'DISCOUNT',
  amount: 20,
  isNetPrice: false,
  isTaxable: false,
  discountId: 'for-all',
};
const DISCOUNT3 = {
  category: 'DISCOUNT',
  amount: 20,
  isNetPrice: false,
  isTaxable: false,
  discountId: 'special',
};
const ITEM1 = { category: 'ITEM', amount: 200, isNetPrice: true, isTaxable: false };
const ITEM2 = { category: 'ITEM', amount: 200, isNetPrice: true, isTaxable: false };
const calculations = [TAX, TAX2, DISCOUNT, DISCOUNT2, DISCOUNT3, ITEM1, ITEM2];

describe('ProductPricingSheet', () => {
  let pricingSheet;

  const pricingSheetParams = {
    calculation: calculations,
    currencyCode: 'CHF',
    quantity: 2,
  };
  beforeEach(() => {
    pricingSheet = ProductPricingSheet(pricingSheetParams);
  });

  it('should return an object that implements the IProductPricingSheet interface', () => {
    assert(pricingSheet);
    assert.equal(pricingSheet.quantity, 2);
    assert.equal(pricingSheet.currencyCode, 'CHF');
    assert.equal(typeof pricingSheet.addItem, 'function');
    assert.equal(typeof pricingSheet.addDiscount, 'function');
    assert.equal(typeof pricingSheet.addTax, 'function');
    assert.equal(typeof pricingSheet.taxSum, 'function');
    assert.equal(typeof pricingSheet.unitPrice, 'function');
    assert.equal(typeof pricingSheet.discountPrices, 'function');
  });

  it('gross() should return the GROSS sum of all ProductPricingCalculation', () => {
    assert.equal(pricingSheet.gross(), 535);
  });

  it('net() should return the NET sum of all ProductPricingCalculation (i.e before TAX)', () => {
    assert.equal(pricingSheet.net(), 460);
  });

  describe('total()', () => {
    it('should return sum of all ProductPricingCalculations ', () => {
      assert.deepEqual(pricingSheet.total(), { amount: 535, currencyCode: 'CHF' });
      assert.deepEqual(pricingSheet.total(), { amount: pricingSheet.gross(), currencyCode: 'CHF' });
    });

    it('should return sum of all ProductPricingCalculations ', () => {
      assert.deepEqual(pricingSheet.total({ useNetPrice: true }), { amount: 460, currencyCode: 'CHF' });
      assert.deepEqual(pricingSheet.total({ useNetPrice: true }), {
        amount: pricingSheet.net(),
        currencyCode: 'CHF',
      });
    });

    it('should return sum of all ProductPricingCalculations for the provided category ', () => {
      assert.deepEqual(pricingSheet.total({ category: 'ITEM' }), { amount: 400, currencyCode: 'CHF' });
      assert.deepEqual(pricingSheet.total({ category: 'DISCOUNT' }), {
        amount: 60,
        currencyCode: 'CHF',
      });
      assert.deepEqual(pricingSheet.total({ category: 'TAX' }), { amount: 75, currencyCode: 'CHF' });
    });
  });

  describe('isValid()', () => {
    it('should return true if there is at least 1 registered ProductPricingCalculation ', () => {
      assert.equal(pricingSheet.isValid(), true);
    });
    it('should return false if there is no registered ProductPricingCalculation ', () => {
      const sheet = ProductPricingSheet({ ...pricingSheetParams, calculation: [] });
      assert.equal(sheet.isValid(), false);
    });
  });

  describe('getRawPricingSheet', () => {
    it('should return all registered ProductPricingCalculation', () => {
      assert.deepEqual(pricingSheet.getRawPricingSheet(), calculations);
    });
  });

  describe('taxSum', () => {
    it('should return the sum of TAX calculation registered on the adapter', () => {
      assert.equal(pricingSheet.taxSum(), 75);
    });
  });

  describe('unitPrice', () => {
    it('should return the GROSS sum for a  product price useNetPrice:false', () => {
      assert.deepEqual(pricingSheet.unitPrice({ useNetPrice: false }), {
        amount: 268,
        currencyCode: 'CHF',
      });
    });

    it('should return the NET sum for a product price when useNetPrice:true', () => {
      assert.deepEqual(pricingSheet.unitPrice({ useNetPrice: true }), {
        amount: 230,
        currencyCode: 'CHF',
      });
    });
  });

  describe('discountPrices', () => {
    it('should return the sum of all discounts registered on the price sheet based on discountId', () => {
      assert.deepEqual(pricingSheet.discountPrices('for-all'), [
        { amount: 40, currencyCode: 'CHF', discountId: 'for-all' },
      ]);
      assert.deepEqual(pricingSheet.discountPrices('special'), [
        { amount: 20, currencyCode: 'CHF', discountId: 'special' },
      ]);
    });

    it('should return empty array if discount with the provided discountId is not found', () => {
      assert.deepEqual(pricingSheet.discountPrices('non-existing'), []);
    });
  });
});
