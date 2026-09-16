import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { configureOrdersModule, OrderStatus } from '@unchainedshop/core-orders';
import { ticketingModules } from '@unchainedshop/ticketing';
import { pluginRegistry } from '@unchainedshop/core';
import { prepareOrderDiscountsForCheckout } from '@unchainedshop/core/lib/services/prepareOrderDiscountsForCheckout.js';
import {
  ReimbursementCodePlugin,
  ReimbursementCode,
} from '@unchainedshop/plugins/pricing/discount-reimbursement-code';

test('concurrent checkouts reserve voucher credit, and settled orders retain exact usage', async () => {
  const server = await MongoMemoryServer.create();
  const client = new MongoClient(server.getUri());
  try {
    await client.connect();
    const db = client.db('ticketing-credit');
    const orders = await configureOrdersModule({ db } as any);
    const passes = await ticketingModules.passes.configure({
      db,
      options: {
        discountCode: { generate: async () => 'voucher', verify: async () => 10000 },
      },
    } as any);
    const modules = { orders, passes } as any;
    pluginRegistry.register(ReimbursementCodePlugin);
    const carts = ['first', 'second'].map((_id) => ({
      _id,
      status: null,
      currencyCode: 'CHF',
      userId: _id,
      calculation: [{ category: 'DISCOUNTS', discountId: `${_id}-discount`, amount: -6001 }],
    }));
    await db.collection<any>('orders').insertMany(carts);
    for (const cart of carts) {
      await orders.discounts.create({
        _id: `${cart._id}-discount`,
        orderId: cart._id,
        code: 'voucher',
        discountKey: ReimbursementCode.key,
        reservation: { remainingDiscount: 10000 },
      });
    }
    assert.equal(await passes.discountCodeUsageBalance('voucher'), 0);
    const results = await Promise.allSettled(
      carts.map((cart) => prepareOrderDiscountsForCheckout.call(modules, cart as any)),
    );
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    const loser = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    assert.match(loser.reason.message, /DISCOUNT_USAGE_LIMIT_EXCEEDED/);
    assert.equal(await passes.discountCodeUsageBalance('voucher'), 6001);
    const winnerIndex = results.findIndex((r) => r.status === 'fulfilled');
    const winner = results[winnerIndex] as PromiseFulfilledResult<{ release: () => Promise<void> }>;
    // A failed payment releases the reservation and restores the full balance.
    await winner.value.release();
    assert.equal(await passes.discountCodeUsageBalance('voucher'), 0);
    const prepared = await prepareOrderDiscountsForCheckout.call(modules, carts[winnerIndex] as any);
    await db
      .collection<any>('orders')
      .updateOne({ _id: carts[winnerIndex]._id }, { $set: { status: OrderStatus.PENDING } });
    await prepared.release();
    assert.equal(await passes.discountCodeUsageBalance('voucher'), 6001);
    const otherCart = carts[1 - winnerIndex];
    const actions = await ReimbursementCode.actions({
      context: { order: otherCart as any, code: 'voucher', modules },
    });
    assert.deepEqual(
      actions.discountForPricingAdapterKey({
        pricingAdapterKey: 'shop.unchained.pricing.order-discount',
        calculationSheet: {} as any,
      }),
      { fixedRate: 3999 },
    );
    await db
      .collection<any>('orders')
      .updateOne({ _id: carts[winnerIndex]._id }, { $set: { status: OrderStatus.REJECTED } });
    assert.equal(await passes.discountCodeUsageBalance('voucher'), 0);
  } finally {
    await client.close();
    await server.stop();
  }
});
