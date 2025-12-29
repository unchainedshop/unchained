import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ProductPricingSheet, ProductPricingRowCategory } from '@unchainedshop/core';
import { ProductRound } from './product-round.ts';

describe('ProductRound', () => {
  beforeEach(() => {
    // Reset settings to defaults before each test
    ProductRound.configure({ defaultPrecision: 5, roundTo: undefined as any });
    ProductRound.settings.roundTo = (value: number, precision: number) =>
      Math.round(value / precision) * precision;
  });

  describe('settings', () => {
    it('should have default rounding precision of 5', () => {
      assert.strictEqual(ProductRound.settings.defaultPrecision, 5);
    });

    it('roundTo should round to nearest precision', () => {
      assert.strictEqual(ProductRound.settings.roundTo(123, 5, 'CHF'), 125);
      assert.strictEqual(ProductRound.settings.roundTo(122, 5, 'CHF'), 120);
      assert.strictEqual(ProductRound.settings.roundTo(127, 10, 'CHF'), 130);
    });

    it('configure should update precision', () => {
      ProductRound.configure({ defaultPrecision: 10, roundTo: undefined as any });
      assert.strictEqual(ProductRound.settings.defaultPrecision, 10);
    });
  });

  describe('calculate', () => {
    it('should round item amount to nearest 5 Rappen', async () => {
      const inputSheet = ProductPricingSheet({
        currencyCode: 'CHF',
        quantity: 1,
        calculation: [
          {
            category: ProductPricingRowCategory.Item,
            amount: 1003,
            isTaxable: true,
            isNetPrice: false,
          },
        ],
      });

      const actions = ProductRound.actions({
        context: { currencyCode: 'CHF', quantity: 1, discounts: [] } as any,
        calculationSheet: inputSheet,
        discounts: [],
      });

      const result = await actions.calculate();

      // The result contains:
      // 1. Negated original: -1003
      // 2. Rounded new value: 1005
      // Net effect: 1005 - 1003 = 2 (rounding adjustment)
      assert.ok(result);
      const sum = result.reduce((acc, r) => acc + r.amount, 0);
      // 1003 rounded to nearest 5 = 1005, difference = +2
      assert.strictEqual(sum, 2);
    });

    it('should round tax amount to nearest 5 Rappen', async () => {
      const inputSheet = ProductPricingSheet({
        currencyCode: 'CHF',
        quantity: 1,
        calculation: [
          {
            category: ProductPricingRowCategory.Tax,
            amount: 77,
            isTaxable: false,
            isNetPrice: false,
            rate: 0.077,
          },
        ],
      });

      const actions = ProductRound.actions({
        context: { currencyCode: 'CHF', quantity: 1, discounts: [] } as any,
        calculationSheet: inputSheet,
        discounts: [],
      });

      const result = await actions.calculate();

      // 77 rounded to nearest 5 = 75, difference = -2
      const sum = result?.reduce((acc, r) => acc + r.amount, 0) ?? 0;
      assert.strictEqual(sum, -2);
    });

    it('should round discount amount to nearest 5 Rappen', async () => {
      const inputSheet = ProductPricingSheet({
        currencyCode: 'CHF',
        quantity: 1,
        calculation: [
          {
            category: ProductPricingRowCategory.Discount,
            amount: -98,
            isTaxable: false,
            isNetPrice: false,
            discountId: 'test',
          },
        ],
      });

      const actions = ProductRound.actions({
        context: { currencyCode: 'CHF', quantity: 1, discounts: [] } as any,
        calculationSheet: inputSheet,
        discounts: [],
      });

      const result = await actions.calculate();

      // -98 rounded to nearest 5 = -100, difference = -2
      const sum = result?.reduce((acc, r) => acc + r.amount, 0) ?? 0;
      assert.strictEqual(sum, -2);
    });

    it('should preserve other calculation properties', async () => {
      const inputSheet = ProductPricingSheet({
        currencyCode: 'CHF',
        quantity: 1,
        calculation: [
          {
            category: ProductPricingRowCategory.Item,
            amount: 1003,
            isTaxable: true,
            isNetPrice: true,
            meta: { original: true },
          },
        ],
      });

      const actions = ProductRound.actions({
        context: { currencyCode: 'CHF', quantity: 1, discounts: [] } as any,
        calculationSheet: inputSheet,
        discounts: [],
      });

      const result = await actions.calculate();

      // The new (positive) entry should preserve properties
      const newEntry = result?.find((r) => r.amount > 0);
      assert.ok(newEntry);
      assert.strictEqual(newEntry.isTaxable, true);
      assert.strictEqual(newEntry.isNetPrice, true);
      assert.deepStrictEqual(newEntry.meta, { original: true });
    });

    it('should handle empty calculation sheet', async () => {
      const inputSheet = ProductPricingSheet({
        currencyCode: 'CHF',
        quantity: 1,
        calculation: [],
      });

      const actions = ProductRound.actions({
        context: { currencyCode: 'CHF', quantity: 1, discounts: [] } as any,
        calculationSheet: inputSheet,
        discounts: [],
      });

      const result = await actions.calculate();

      assert.ok(result);
      assert.strictEqual(result.length, 0);
    });

    it('should use configured precision', async () => {
      ProductRound.configure({ defaultPrecision: 10, roundTo: undefined as any });
      ProductRound.settings.roundTo = (value: number, precision: number) =>
        Math.round(value / precision) * precision;

      const inputSheet = ProductPricingSheet({
        currencyCode: 'CHF',
        quantity: 1,
        calculation: [
          {
            category: ProductPricingRowCategory.Item,
            amount: 1003,
            isTaxable: true,
            isNetPrice: false,
          },
        ],
      });

      const actions = ProductRound.actions({
        context: { currencyCode: 'CHF', quantity: 1, discounts: [] } as any,
        calculationSheet: inputSheet,
        discounts: [],
      });

      const result = await actions.calculate();

      // 1003 rounded to nearest 10 = 1000, difference = -3
      const sum = result?.reduce((acc, r) => acc + r.amount, 0) ?? 0;
      assert.strictEqual(sum, -3);
    });
  });
});
