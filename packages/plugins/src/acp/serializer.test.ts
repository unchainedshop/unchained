import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Order } from '@unchainedshop/core-orders';
import type { ACPContext } from './config.ts';
import { serializeCheckoutSession } from './serializer.ts';

const context = {
  modules: {
    orders: {
      positions: { findOrderPositions: async () => [] },
      deliveries: { findDelivery: async () => null },
    },
  },
  services: { orders: { supportedDeliveryProviders: async () => [] } },
} as unknown as ACPContext;

describe('serializeCheckoutSession', () => {
  it('breaks the total down into net amounts and tax that add up to it', async () => {
    const order = {
      _id: 'order-id',
      currencyCode: 'CHF',
      calculation: [
        { category: 'ITEMS', amount: 1000, isNetPrice: true },
        { category: 'TAXES', amount: 81, baseCategory: 'ITEMS', isNetPrice: false },
        { category: 'DELIVERY', amount: 500, isNetPrice: true },
        { category: 'TAXES', amount: 40.5, baseCategory: 'DELIVERY', isNetPrice: false },
        { category: 'DISCOUNTS', amount: -100, isNetPrice: true, discountId: 'discount-id' },
        {
          category: 'TAXES',
          amount: -8.1,
          baseCategory: 'DISCOUNTS',
          discountId: 'discount-id',
          isNetPrice: false,
        },
      ],
    } as unknown as Order;

    const session = await serializeCheckoutSession(order, context);

    assert.deepEqual(
      session.totals.map(({ type, amount }) => [type, amount]),
      [
        ['items_base_amount', 1000],
        ['discount', 100],
        ['fulfillment', 500],
        ['tax', 113],
        ['total', 1513],
      ],
    );
    assert.equal(Object.hasOwn(session.capabilities, 'extensions'), false);
  });
});
