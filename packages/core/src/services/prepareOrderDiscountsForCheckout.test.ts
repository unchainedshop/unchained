import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrderDiscountDirector } from '../directors/OrderDiscountDirector.ts';
import { prepareOrderDiscountsForCheckout } from './prepareOrderDiscountsForCheckout.ts';

test('checkout reserves credit through adapters, releases on failure and never throws on release', async () => {
  const released: string[] = [];
  const adapters: Record<string, any> = {
    plain: { actions: async () => ({}) },
    credit: {
      actions: async ({ context }: any) => ({
        prepareForCheckout: async () => ({
          release: async () => {
            released.push(context.orderDiscount._id);
          },
        }),
      }),
    },
    exhausted: {
      actions: async () => ({
        prepareForCheckout: async () => {
          throw new Error('DISCOUNT_USAGE_LIMIT_EXCEEDED');
        },
      }),
    },
    broken: {
      actions: async () => ({
        prepareForCheckout: async () => ({
          release: async () => {
            throw new Error('database unavailable');
          },
        }),
      }),
    },
  };
  const getAdapter = OrderDiscountDirector.getAdapter;
  OrderDiscountDirector.getAdapter = (key) => adapters[key] || null;
  try {
    const modules = (discounts: { _id: string; discountKey: string }[]) =>
      ({ orders: { discounts: { findOrderDiscounts: async () => discounts } } }) as any;
    const order = { _id: 'order' } as any;

    const prepared = await prepareOrderDiscountsForCheckout.call(
      modules([
        { _id: 'a', discountKey: 'plain' },
        { _id: 'b', discountKey: 'credit' },
        { _id: 'c', discountKey: 'unregistered' },
        { _id: 'd', discountKey: 'broken' },
      ]),
      order,
    );
    await prepared.release();
    assert.deepEqual(released, ['b']);

    released.length = 0;
    await assert.rejects(
      prepareOrderDiscountsForCheckout.call(
        modules([
          { _id: 'b', discountKey: 'credit' },
          { _id: 'e', discountKey: 'exhausted' },
        ]),
        order,
      ),
      /DISCOUNT_USAGE_LIMIT_EXCEEDED/,
    );
    assert.deepEqual(released, ['b']);
  } finally {
    OrderDiscountDirector.getAdapter = getAdapter;
  }
});
