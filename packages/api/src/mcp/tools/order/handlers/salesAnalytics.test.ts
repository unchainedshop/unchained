import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { OrderPricingSheet, type OrderPricingCalculation } from '@unchainedshop/core';
import type { Context } from '../../../../context.ts';
import getMonthlyBreakdown from './getMonthlyBreakdown.ts';
import getSalesSummary from './getSalesSummary.ts';

const params = { from: '2026-09-01T00:00:00Z', to: '2026-09-30T23:59:59Z', days: 30 };

const contextForCalculations = (calculations: (OrderPricingCalculation[] | undefined)[]) =>
  ({
    modules: {
      orders: {
        findOrders: async () =>
          calculations.map((calculation, index) => ({
            _id: `order-${index}`,
            created: new Date('2026-09-07T12:00:00Z'),
            currencyCode: 'CHF',
            calculation,
          })),
      },
    },
  }) as unknown as Context;

for (const [name, handler] of [
  ['sales summary', getSalesSummary],
  ['monthly breakdown', getMonthlyBreakdown],
] as const) {
  describe(name, () => {
    test('reports the same gross item revenue for fresh and migrated orders', async () => {
      const fresh = OrderPricingSheet({ currencyCode: 'CHF' });
      fresh.addItems({ amount: 9_285, taxAmount: 715 });
      fresh.addDelivery({ amount: 1_857, taxAmount: 143 });
      fresh.addPayment({ amount: 464, taxAmount: 36 });
      fresh.addDiscount({ amount: -928.5, taxAmount: -71.5, discountId: 'discount' });

      const migrated: OrderPricingCalculation[] = [
        { category: 'ITEMS', amount: 10_000 },
        { category: 'ITEMS', amount: -715, isNetPrice: true },
        { category: 'TAXES', baseCategory: 'ITEMS', amount: 715 },
        ...fresh.calculation.filter((row) => row.category !== 'ITEMS' && row.baseCategory !== 'ITEMS'),
      ];

      const freshResult = await handler(contextForCalculations([fresh.calculation]), params);
      const migratedResult = await handler(contextForCalculations([migrated]), params);
      assert.equal(freshResult.totalSalesAmount, 10_000);
      assert.deepEqual(freshResult, migratedResult);

      const combined = await handler(contextForCalculations([fresh.calculation, migrated]), params);
      assert.equal(combined.totalSalesAmount, 20_000);
      assert.equal(combined.orderCount, 2);
      assert.equal(combined.averageOrderValue, 10_000);
      assert.deepEqual(
        combined.summary
          .filter(({ orders }) => orders)
          .map(({ sales, orders, avgOrderValue }) => ({ sales, orders, avgOrderValue })),
        [{ sales: 20_000, orders: 2, avgOrderValue: 10_000 }],
      );
    });

    test('sums every item balance and tax without rounding individual orders', async () => {
      const pricing = OrderPricingSheet({ currencyCode: 'CHF' });
      pricing.addItems({ amount: 1.125, taxAmount: 0.125 });
      pricing.addItems({ amount: 0.5, taxAmount: 0.125 });
      pricing.addDelivery({ amount: 10, taxAmount: 1 });

      const result = await handler(
        contextForCalculations([pricing.calculation, pricing.calculation]),
        params,
      );

      assert.equal(result.totalSalesAmount, 3.75);
      assert.equal(result.averageOrderValue, 1.875);
      assert.deepEqual(
        result.summary
          .filter(({ orders }) => orders)
          .map(({ sales, orders, avgOrderValue }) => ({ sales, orders, avgOrderValue })),
        [{ sales: 3.75, orders: 2, avgOrderValue: 2 }],
      );
    });

    test('counts orders with absent or empty calculations without adding revenue', async () => {
      const result = await handler(contextForCalculations([undefined, []]), params);

      assert.equal(result.totalSalesAmount, 0);
      assert.equal(result.orderCount, 2);
      assert.equal(result.averageOrderValue, 0);
    });
  });
}
