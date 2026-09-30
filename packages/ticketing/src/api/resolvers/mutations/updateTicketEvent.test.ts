import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import updateTicketEvent from './updateTicketEvent.ts';

test('event details are merged into the product meta without touching the tokenization', async () => {
  const server = await MongoMemoryServer.create();
  const client = new MongoClient(server.getUri());
  try {
    await client.connect();
    const Products = client.db('ticket-event-update').collection<any>('products');
    const tokenization = {
      contractStandard: 'ERC721',
      supply: 100,
      ercMetadataProperties: { seatMap: 'A' },
    };
    await Products.insertMany([
      {
        _id: 'event',
        type: 'TOKENIZED_PRODUCT',
        status: 'ACTIVE',
        meta: { slot: '2026-10-01T19:00:00.000Z', location: 'Old hall', cancelled: false },
        tokenization,
      },
      { _id: 'cleared', type: 'TOKENIZED_PRODUCT', status: null, meta: null },
      { _id: 'unconfigured', type: 'TOKENIZED_PRODUCT', status: null },
      { _id: 'simple', type: 'SIMPLE_PRODUCT', status: 'ACTIVE' },
    ]);
    const updates: any[] = [];
    const context = {
      userId: 'manager',
      user: { _id: 'manager', roles: ['admin'] },
      modules: {
        products: {
          findProduct: async ({ productId }: any) => Products.findOne({ _id: productId }),
          firstActiveProductProxy: async () => null,
          update: async (productId: string, doc: any) => {
            updates.push(doc);
            await Products.updateOne({ _id: productId }, { $set: { updated: new Date(), ...doc } });
            return productId;
          },
        },
      },
    } as any;
    const update = async (productId: string, event: Record<string, unknown>): Promise<any> =>
      updateTicketEvent(undefined as never, { productId, event }, context);

    const startsAt = new Date('2026-10-02T18:30:00Z');
    const updated = await update('event', {
      startsAt,
      durationMinutes: 90,
      doorsOpenMinutesBefore: 30,
      category: 'Parkett',
    });
    assert.deepEqual(updated.meta, {
      slot: startsAt,
      location: 'Old hall',
      cancelled: false,
      durationMinutes: 90,
      doorsOpenMinutesBefore: 30,
      category: 'Parkett',
    });
    assert.ok(updated.meta.slot instanceof Date, 'stored as a real date');
    assert.deepEqual(updated.tokenization, tokenization);
    assert.ok(Object.keys(updates[0]).every((key) => key.startsWith('meta.')));

    // null or an empty text clears a detail, omitted details stay.
    const cleared = await update('event', { location: '  ', category: null });
    assert.equal(cleared.meta.location, null);
    assert.equal(cleared.meta.category, null);
    assert.equal(cleared.meta.durationMinutes, 90);

    const fromNull = await update('cleared', { location: 'New hall', durationMinutes: null });
    assert.deepEqual(fromNull.meta, { location: 'New hall' });

    // The event details do not depend on a configured tokenization
    const unconfigured = await update('unconfigured', { location: 'Hall' });
    assert.deepEqual(unconfigured.meta, { location: 'Hall' });

    const nothing = await update('event', {});
    assert.equal(nothing._id, 'event');

    for (const [productId, code] of [
      ['missing', 'ProductNotFoundError'],
      ['simple', 'ProductWrongTypeError'],
      ['', 'InvalidIdError'],
    ]) {
      await assert.rejects(update(productId, { location: 'Hall' }), (error: any) => {
        assert.equal(error.extensions?.code, code, productId);
        return true;
      });
    }
  } finally {
    await client.close();
    await server.stop();
  }
});

test('sale rules are merged into meta.saleRules rule by rule', async () => {
  const server = await MongoMemoryServer.create();
  const client = new MongoClient(server.getUri());
  try {
    await client.connect();
    const Products = client.db('ticket-event-sale-rules').collection<any>('products');
    await Products.insertOne({
      _id: 'event',
      type: 'TOKENIZED_PRODUCT',
      status: 'ACTIVE',
      meta: { slot: new Date('2026-10-02T18:30:00Z'), saleRules: { onSale: false } },
    });
    const context = {
      userId: 'manager',
      user: { _id: 'manager', roles: ['admin'] },
      modules: {
        products: {
          findProduct: async ({ productId }: any) => Products.findOne({ _id: productId }),
          firstActiveProductProxy: async () => null,
          update: async (productId: string, doc: any) => {
            await Products.updateOne({ _id: productId }, { $set: doc });
            return productId;
          },
        },
      },
    } as any;
    const update = async (event: Record<string, unknown>): Promise<any> =>
      updateTicketEvent(undefined as never, { productId: 'event', event }, context);

    const opened = await update({
      saleRules: { salesStart: '2026-09-01T08:00:00.000Z', maxPerOrder: 4 },
    });
    assert.deepEqual(opened.meta.saleRules, {
      onSale: false,
      salesStart: new Date('2026-09-01T08:00:00.000Z'),
      maxPerOrder: 4,
    });
    assert.deepEqual(opened.meta.slot, new Date('2026-10-02T18:30:00Z'));

    const cleared = await update({ saleRules: { onSale: null, maxPerOrder: 2 } });
    assert.deepEqual(cleared.meta.saleRules, {
      onSale: null,
      salesStart: new Date('2026-09-01T08:00:00.000Z'),
      maxPerOrder: 2,
    });

    await assert.rejects(update({ saleRules: { maxPerOrder: -1 } }), (error: any) => {
      assert.equal(error.extensions?.code, 'InvalidTicketSaleRulesError');
      return true;
    });
  } finally {
    await client.close();
    await server.stop();
  }
});
