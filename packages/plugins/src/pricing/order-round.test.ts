import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { OrderPricingSheet, OrderPricingRowCategory } from '@unchainedshop/core';
import { OrderPriceRound } from './order-round.ts';

describe('OrderPriceRound', () => {
  beforeEach(() => {
    // Reset settings to defaults before each test
    OrderPriceRound.configure({ defaultPrecision: 5, roundTo: undefined as any });
    OrderPriceRound.settings.roundTo = (value: number, precision: number) =>
      precision !== 0 ? Math.round(value / precision) * precision : value;
  });

  describe('settings', () => {
    it('should have default rounding precision of 5', () => {
      assert.strictEqual(OrderPriceRound.settings.defaultPrecision, 5);
    });

    it('roundTo should round to nearest precision', () => {
      assert.strictEqual(OrderPriceRound.settings.roundTo(123, 5, 'CHF'), 125);
      assert.strictEqual(OrderPriceRound.settings.roundTo(122, 5, 'CHF'), 120);
      assert.strictEqual(OrderPriceRound.settings.roundTo(100, 0, 'CHF'), 100);
    });

    it('configure should update precision', () => {
      OrderPriceRound.configure({ defaultPrecision: 10, roundTo: undefined as any });
      assert.strictEqual(OrderPriceRound.settings.defaultPrecision, 10);
    });
  });

  describe('calculate', () => {
    it('should add rounding adjustment entries for items', async () => {
      const inputSheet = OrderPricingSheet({ currencyCode: 'CHF' });
      inputSheet.addItems({ amount: 1003, taxAmount: 77, meta: {} });

      const actions = OrderPriceRound.actions({
        context: { currencyCode: 'CHF', discounts: [] } as any,
        calculationSheet: inputSheet,
        discounts: [],
      });

      const result = await actions.calculate();

      // Verify rounding adjustment was added for items
      const itemsRounding = result?.find(
        (r) => r.category === OrderPricingRowCategory.Items && r.meta?.adapter === OrderPriceRound.key,
      );
      assert.ok(itemsRounding, 'Should have items rounding entry');
      // The adjustment depends on the net amount calculation
      // Net: 1003 - 77 = 926, rounded to 925, diff = -1
      assert.strictEqual(itemsRounding.amount, -1);
    });

    it('should add rounding adjustment entries for delivery', async () => {
      const inputSheet = OrderPricingSheet({ currencyCode: 'CHF' });
      inputSheet.addDelivery({ amount: 901, taxAmount: 69, meta: {} });

      const actions = OrderPriceRound.actions({
        context: { currencyCode: 'CHF', discounts: [] } as any,
        calculationSheet: inputSheet,
        discounts: [],
      });

      const result = await actions.calculate();

      const deliveryRounding = result?.find(
        (r) =>
          r.category === OrderPricingRowCategory.Delivery && r.meta?.adapter === OrderPriceRound.key,
      );
      assert.ok(deliveryRounding, 'Should have delivery rounding entry');
      // Net: 901 - 69 = 832, rounded to 830, diff = -2
      assert.strictEqual(deliveryRounding.amount, -2);
    });

    it('should add rounding adjustment entries for payment', async () => {
      const inputSheet = OrderPricingSheet({ currencyCode: 'CHF' });
      inputSheet.addPayment({ amount: 53, taxAmount: 4, meta: {} });

      const actions = OrderPriceRound.actions({
        context: { currencyCode: 'CHF', discounts: [] } as any,
        calculationSheet: inputSheet,
        discounts: [],
      });

      const result = await actions.calculate();

      const paymentRounding = result?.find(
        (r) => r.category === OrderPricingRowCategory.Payment && r.meta?.adapter === OrderPriceRound.key,
      );
      assert.ok(paymentRounding, 'Should have payment rounding entry');
      // Net: 53 - 4 = 49, rounded to 50, diff = +1
      assert.strictEqual(paymentRounding.amount, 1);
    });

    it('should add rounding adjustment entries for discount', async () => {
      const inputSheet = OrderPricingSheet({ currencyCode: 'CHF' });
      inputSheet.addDiscount({ amount: -203, taxAmount: -16, discountId: 'test', meta: {} });

      const actions = OrderPriceRound.actions({
        context: { currencyCode: 'CHF', discounts: [] } as any,
        calculationSheet: inputSheet,
        discounts: [],
      });

      const result = await actions.calculate();

      const discountRounding = result?.find(
        (r) =>
          r.category === OrderPricingRowCategory.Discounts && r.meta?.adapter === OrderPriceRound.key,
      );
      assert.ok(discountRounding, 'Should have discount rounding entry');
      // Net: -203 - (-16) = -187, rounded to -185, diff = +2
      assert.strictEqual(discountRounding.amount, 2);
    });

    it('should not apply rounding when currencyCode is missing', async () => {
      const inputSheet = OrderPricingSheet({ currencyCode: 'CHF' });
      inputSheet.addItems({ amount: 1003, taxAmount: 77, meta: {} });

      const actions = OrderPriceRound.actions({
        context: { discounts: [] } as any,
        calculationSheet: inputSheet,
        discounts: [],
      });

      const result = await actions.calculate();

      // Should return empty result sheet since no currency
      const roundingEntries = result?.filter((r) => r.meta?.adapter === OrderPriceRound.key);
      assert.strictEqual(roundingEntries?.length, 0);
    });

    it('should add tax rounding adjustments', async () => {
      const inputSheet = OrderPricingSheet({ currencyCode: 'CHF' });
      inputSheet.addItems({ amount: 1003, taxAmount: 77, meta: {} });

      const actions = OrderPriceRound.actions({
        context: { currencyCode: 'CHF', discounts: [] } as any,
        calculationSheet: inputSheet,
        discounts: [],
      });

      const result = await actions.calculate();

      const taxRounding = result?.filter(
        (r) => r.category === OrderPricingRowCategory.Taxes && r.meta?.adapter === OrderPriceRound.key,
      );
      assert.ok(taxRounding && taxRounding.length > 0);
    });

    it('should correctly adjust amounts when already rounded', async () => {
      const inputSheet = OrderPricingSheet({ currencyCode: 'CHF' });
      inputSheet.addItems({ amount: 1000, taxAmount: 75, meta: {} }); // Net: 925, already ends in 5

      const actions = OrderPriceRound.actions({
        context: { currencyCode: 'CHF', discounts: [] } as any,
        calculationSheet: inputSheet,
        discounts: [],
      });

      const result = await actions.calculate();

      const itemsRounding = result?.find(
        (r) => r.category === OrderPricingRowCategory.Items && r.meta?.adapter === OrderPriceRound.key,
      );
      assert.ok(itemsRounding);
      // Net: 1000 - 75 = 925, already rounded, difference = 0
      assert.strictEqual(itemsRounding.amount, 0);
    });
  });
});
