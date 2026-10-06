import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { OrderStatus } from '@unchainedshop/core-orders';
import ticketingModules, { APPLE_WALLET_PASSES_FILE_DIRECTORY } from './module.ts';
import { RendererTypes, registerRenderer, renderers } from './template-registry.ts';

test('voucher usage counts checkout reservations of carts and discount rows of placed orders', async () => {
  // Use MONGO_URL (npm test shares the run's MongoDB), else start a server of its own
  const server = process.env.MONGO_URL ? undefined : await MongoMemoryServer.create();
  const client = new MongoClient(process.env.MONGO_URL || server.getUri());
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
    await server?.stop();
  }
});

describe('ticket serials, ticket counts and Apple pass refresh', () => {
  let server: MongoMemoryServer | undefined;
  let client: MongoClient;
  before(async () => {
    // Use MONGO_URL (npm test shares the run's MongoDB), else start a server of its own
    server = process.env.MONGO_URL ? undefined : await MongoMemoryServer.create();
    client = new MongoClient(process.env.MONGO_URL || server.getUri());
    await client.connect();
  });
  after(async () => {
    await client?.close();
    await server?.stop();
  });

  const configure = async (name: string) => {
    const db = client.db(name);
    const passes = await ticketingModules.passes.configure({ db, options: {} } as any);
    return { db, passes };
  };

  const ticket = (_id: string, fields: Record<string, unknown> = {}) => ({
    _id,
    productId: 'event',
    quantity: 1,
    tokenSerialNumber: _id,
    orderPositionId: `${_id}-position`,
    meta: {},
    ...fields,
  });

  test('concurrent reservations get distinct, contiguous serials', async () => {
    const { passes } = await configure('serials-concurrent');
    const counts = [1, 3, 2, 1, 4, 1, 2, 5, 1, 1];
    const reservations = await Promise.all(
      counts.map((count) => passes.reserveTicketSerials('event', count)),
    );
    reservations.forEach((serials, index) => {
      assert.equal(serials.length, counts[index]);
      serials.forEach((serial, offset) => assert.equal(Number(serial), Number(serials[0]) + offset));
    });
    const all = reservations
      .flat()
      .map(Number)
      .sort((a, b) => a - b);
    assert.deepEqual(
      all,
      Array.from({ length: 21 }, (_, index) => index + 1),
    );
    assert.deepEqual(await passes.reserveTicketSerials('other-event', 2), ['1', '2']);
  });

  test('the serial counter continues after the highest numeric serial already issued', async () => {
    const { db, passes } = await configure('serials-seed');
    await db
      .collection<any>('token_surrogates')
      .insertMany([
        ticket('a', { tokenSerialNumber: '7' }),
        ticket('b', { tokenSerialNumber: '12' }),
        ticket('c', { tokenSerialNumber: 'VIP-1' }),
        ticket('d', { tokenSerialNumber: '99', productId: 'other-event' }),
      ]);
    assert.deepEqual(await passes.reserveTicketSerials('event', 2, { offset: 5 }), ['13', '14']);
    assert.deepEqual(await passes.reserveTicketSerials('event', 1), ['15']);
  });

  test('the offset seeds the numbering of a product only once', async () => {
    const { passes } = await configure('serials-offset');
    assert.deepEqual(await passes.reserveTicketSerials('event', 2, { offset: 1000 }), ['1001', '1002']);
    assert.deepEqual(await passes.reserveTicketSerials('event', 1, { offset: 5000 }), ['1003']);
    assert.deepEqual(await passes.reserveTicketSerials('zero-based', 2, { offset: -1 }), ['0', '1']);
    assert.deepEqual(await passes.reserveTicketSerials('empty', 0), []);
    assert.deepEqual(await passes.reserveTicketSerials('empty', 1), ['1']);
  });

  test('issued tickets are counted in units, optionally without the cancelled ones', async () => {
    const { db, passes } = await configure('ticket-counts');
    await db
      .collection<any>('token_surrogates')
      .insertMany([
        ticket('a'),
        ticket('b', { quantity: 3 }),
        ticket('c', { quantity: 2, meta: { cancelled: true } }),
        ticket('d', { meta: { cancelled: false } }),
        ticket('e', { quantity: 5, productId: 'other-event' }),
      ]);
    assert.equal(await passes.countIssuedTickets('event'), 7);
    assert.equal(await passes.countIssuedTickets('event', { skipCancelled: true }), 5);
    assert.equal(await passes.countIssuedTickets('unknown'), 0);
    assert.equal(await passes.getTicketsCreated({ productId: 'event' }, { skipCancelled: true }), 5);
    assert.equal(await passes.getTicketsCreated({ productId: 'event' }), 7);
  });

  test('reserved tickets add pending orders, which are not issued yet', async () => {
    const { db, passes } = await configure('ticket-reservations');
    await db.collection<any>('orders').insertMany([
      { _id: 'pending-a', status: OrderStatus.PENDING },
      { _id: 'pending-b', status: OrderStatus.PENDING },
      { _id: 'cart', status: null },
      { _id: 'confirmed', status: OrderStatus.CONFIRMED },
      { _id: 'rejected', status: OrderStatus.REJECTED },
    ]);
    const position = (_id: string, orderId: string, quantity: number, productId = 'event') => ({
      _id,
      orderId,
      productId,
      quantity,
    });
    await db
      .collection<any>('order_positions')
      .insertMany([
        position('p1', 'pending-a', 2),
        position('p2', 'pending-a', 4, 'other-event'),
        position('p3', 'pending-b', 1),
        position('p4', 'cart', 7),
        position('p5', 'confirmed', 3),
        position('p6', 'rejected', 5),
      ]);
    await db
      .collection<any>('token_surrogates')
      .insertMany([
        ticket('a'),
        ticket('b', { quantity: 2 }),
        ticket('c', { meta: { cancelled: true } }),
      ]);
    assert.equal(await passes.countReservedTickets({ productId: 'event' }), 3 + 3);
    assert.equal(
      await passes.countReservedTickets({ productId: 'event', excludeOrderId: 'pending-a' }),
      3 + 1,
    );
    assert.equal(await passes.countReservedTickets({ productId: 'other-event' }), 4);
  });

  test('cancelling a ticket records when it was cancelled', async () => {
    const { db, passes } = await configure('ticket-cancel');
    await db.collection<any>('token_surrogates').insertOne(ticket('a', { meta: { orderId: 'order' } }));
    const before = Date.now();
    const cancelled = await passes.cancelTicket('a');
    assert.equal(cancelled?.meta.cancelled, true);
    assert.equal(cancelled?.meta.orderId, 'order');
    assert.ok(cancelled?.meta.cancelledDate instanceof Date);
    assert.ok(cancelled!.meta.cancelledDate.getTime() >= before);
    assert.equal(await passes.cancelTicket('unknown'), null);
  });

  test('a cancellation limited to valid tickets leaves redeemed and cancelled ones alone', async () => {
    const { db, passes } = await configure('ticket-cancel-valid');
    const redeemedAt = new Date('2026-09-01T18:00:00Z');
    const cancelledAt = new Date('2026-09-01T12:00:00Z');
    const tokens = db.collection<any>('token_surrogates');
    await tokens.insertMany([
      ticket('valid'),
      ticket('redeemed', { invalidatedDate: redeemedAt }),
      ticket('cancelled', { meta: { cancelled: true, cancelledDate: cancelledAt } }),
    ]);
    assert.equal((await passes.cancelTicket('valid', { onlyValid: true }))?.meta.cancelled, true);
    assert.equal(await passes.cancelTicket('redeemed', { onlyValid: true }), null);
    assert.equal(await passes.cancelTicket('cancelled', { onlyValid: true }), null);
    assert.deepEqual((await tokens.findOne({ _id: 'redeemed' }))?.meta, {});
    assert.deepEqual((await tokens.findOne({ _id: 'cancelled' }))?.meta.cancelledDate, cancelledAt);
    // Without the limit a redeemed ticket is still cancelled, as an event cancellation needs it.
    assert.equal((await passes.cancelTicket('redeemed'))?.meta.cancelled, true);
  });

  test('Apple passes are refreshed for the invalidated ticket only', async () => {
    const { db, passes } = await configure('apple-refresh');
    const registered = new Map(renderers);
    const rendered: string[] = [];
    const files = db.collection<any>('media_objects');
    const unchainedAPI = {
      services: {
        files: {
          uploadFileFromStream: async ({ directoryName, meta }) => {
            const file = { _id: randomUUID(), path: directoryName, meta, created: new Date() };
            await files.insertOne(file);
            return file;
          },
          removeFiles: async ({ fileIds }) => files.deleteMany({ _id: { $in: fileIds } }),
        },
      },
    } as any;
    // Without an Apple renderer there is nothing to refresh.
    registerRenderer(RendererTypes.APPLE_WALLET, null);
    await passes.invalidateAppleWalletPasses(unchainedAPI, { _id: 'a' });
    await passes.invalidateAppleWalletPasses(unchainedAPI);
    registerRenderer(RendererTypes.APPLE_WALLET, async (token) => {
      rendered.push(token._id);
      return {
        serialNumber: `serial-${token._id}`,
        passTypeIdentifier: 'pass.test',
        asBuffer: async () => Buffer.from(token._id),
        asURL: async () => '',
      };
    });
    try {
      const tokens = db.collection<any>('token_surrogates');
      await tokens.insertMany([ticket('a'), ticket('b'), ticket('no-pass')]);
      for (const tokenId of ['a', 'b']) {
        await passes.upsertAppleWalletPass((await tokens.findOne({ _id: tokenId }))!, unchainedAPI);
      }
      rendered.length = 0;

      await tokens.updateOne({ _id: 'a' }, { $set: { invalidatedDate: new Date() } });
      await tokens.updateOne({ _id: 'no-pass' }, { $set: { invalidatedDate: new Date() } });
      await passes.invalidateAppleWalletPasses(unchainedAPI, { _id: 'a' });
      await passes.invalidateAppleWalletPasses(unchainedAPI, { _id: 'no-pass' });
      assert.deepEqual(rendered, ['a']);
      const [passOfA] = await files.find({ 'meta.rawData._id': 'a' }).toArray();
      assert.ok(passOfA.meta.rawData.invalidatedDate instanceof Date);
      assert.equal(await files.countDocuments({ path: APPLE_WALLET_PASSES_FILE_DIRECTORY }), 2);

      // An unchanged ticket is not rendered again.
      await passes.invalidateAppleWalletPasses(unchainedAPI, { _id: 'a' });
      assert.deepEqual(rendered, ['a']);

      // Cancelled tickets are refreshed as well; concurrent calls without a ticket are coalesced.
      await tokens.updateOne(
        { _id: 'b' },
        { $set: { invalidatedDate: new Date(), 'meta.cancelled': true } },
      );
      await Promise.all(
        Array.from({ length: 5 }, () => passes.invalidateAppleWalletPasses(unchainedAPI)),
      );
      assert.deepEqual(rendered, ['a', 'b']);
      assert.equal(await files.countDocuments({ path: APPLE_WALLET_PASSES_FILE_DIRECTORY }), 2);
    } finally {
      renderers.clear();
      for (const [type, renderer] of registered) renderers.set(type, renderer);
    }
  });
});
