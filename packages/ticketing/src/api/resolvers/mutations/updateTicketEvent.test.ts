import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import updateTicketEvent from './updateTicketEvent.ts';

test('event details are merged into the public tokenization properties without touching the others', async () => {
  const server = await MongoMemoryServer.create();
  const client = new MongoClient(server.getUri());
  try {
    await client.connect();
    const Products = client.db('ticket-event-update').collection<any>('products');
    const tokenization = (ercMetadataProperties: unknown) => ({
      contractStandard: 'ERC721',
      supply: 100,
      ercMetadataProperties,
    });
    await Products.insertMany([
      {
        _id: 'event',
        type: 'TOKENIZED_PRODUCT',
        status: 'ACTIVE',
        tokenization: tokenization({
          slot: '2026-10-01T19:00:00.000Z',
          location: 'Old hall',
          seatMap: 'A',
        }),
      },
      { _id: 'cleared', type: 'TOKENIZED_PRODUCT', status: null, tokenization: tokenization(null) },
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
    assert.deepEqual(updated.tokenization.ercMetadataProperties, {
      slot: startsAt,
      location: 'Old hall',
      seatMap: 'A',
      durationMinutes: 90,
      doorsOpenMinutesBefore: 30,
      category: 'Parkett',
    });
    assert.ok(updated.tokenization.ercMetadataProperties.slot instanceof Date, 'stored as a real date');
    assert.equal(updated.tokenization.supply, 100);
    assert.ok(
      Object.keys(updates[0]).every((key) => key.startsWith('tokenization.ercMetadataProperties.')),
    );

    // null or an empty text clears a detail, omitted details stay.
    const cleared = await update('event', { location: '  ', category: null });
    assert.equal(cleared.tokenization.ercMetadataProperties.location, null);
    assert.equal(cleared.tokenization.ercMetadataProperties.category, null);
    assert.equal(cleared.tokenization.ercMetadataProperties.durationMinutes, 90);

    const fromNull = await update('cleared', { location: 'New hall', durationMinutes: null });
    assert.deepEqual(fromNull.tokenization.ercMetadataProperties, { location: 'New hall' });

    const nothing = await update('event', {});
    assert.equal(nothing._id, 'event');

    for (const [productId, code] of [
      ['missing', 'ProductNotFoundError'],
      ['simple', 'ProductWrongTypeError'],
      ['unconfigured', 'ProductWrongStatusError'],
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
