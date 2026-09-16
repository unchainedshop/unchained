import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { OrderStatus } from '@unchainedshop/core-orders';
import ticketingModules from './module.ts';

test('voucher usage counts checkout reservations of carts and discount rows of placed orders', async () => {
  const server = await MongoMemoryServer.create();
  const client = new MongoClient(server.getUri());
  try {
    await client.connect();
    const db = client.db('ticketing-usage');
    const passes = await ticketingModules.passes.configure({
      db,
      options: { discountCode: { generate: async () => 'code', verify: async () => null } },
    } as any);
    const order = (_id: string, status: OrderStatus | null, amount: number) => ({
      _id,
      status,
      currencyCode: 'CHF',
      calculation: [
        { category: 'ITEMS', amount: 10000 },
        { category: 'DISCOUNTS', discountId: `${_id}-discount`, amount: -amount },
        { category: 'TAXES', discountId: `${_id}-discount`, amount: -Math.round(amount * 0.077) },
        { category: 'DISCOUNTS', discountId: 'other', amount: -500 },
      ],
    });
    await db
      .collection<any>('orders')
      .insertMany([
        order('reserved-cart', null, 4000),
        order('released-cart', null, 4000),
        order('pending', OrderStatus.PENDING, 2500),
        order('confirmed', OrderStatus.CONFIRMED, 1000),
        order('rejected', OrderStatus.REJECTED, 9000),
      ]);
    await db.collection<any>('order_discounts').insertMany([
      {
        _id: 'reserved-cart-discount',
        orderId: 'reserved-cart',
        code: 'voucher',
        reservation: { checkoutAmount: 4000 },
      },
      {
        _id: 'released-cart-discount',
        orderId: 'released-cart',
        code: 'voucher',
        reservation: { checkoutAmount: 0 },
      },
      { _id: 'pending-discount', orderId: 'pending', code: 'voucher', reservation: {} },
      { _id: 'confirmed-discount', orderId: 'confirmed', code: 'voucher' },
      { _id: 'rejected-discount', orderId: 'rejected', code: 'voucher' },
      { _id: 'other', orderId: 'confirmed', code: 'other-voucher' },
      { _id: 'spare', code: 'voucher' },
    ]);
    assert.equal(await passes.discountCodeUsageBalance('voucher'), 4000 + 2500 + 1000);
    assert.equal(await passes.discountCodeUsageBalance('voucher', 'pending'), 4000 + 1000);
    assert.equal(await passes.discountCodeUsageBalance('unknown'), 0);
  } finally {
    await client.close();
    await server.stop();
  }
});
