import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { MongoClient, type Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getEmitAdapter, setEmitAdapter, type EmitAdapter } from '@unchainedshop/events';
import { OrderPositionsCollection, type OrderPosition } from '../db/OrderPositionsCollection.ts';
import {
  configureOrderPositionsModule,
  type OrderPositionsModule,
} from './configureOrderPositionsModule.ts';

const position = (
  _id: string,
  orderId: string,
  configuration: OrderPosition['configuration'],
): OrderPosition => ({
  _id,
  orderId,
  configuration,
  created: new Date('2026-01-01'),
  productId: 'product',
  originalProductId: 'product',
  quantity: 1,
  calculation: [],
  scheduling: [],
});

describe('configureOrderPositionsModule', () => {
  let server: MongoMemoryServer | undefined;
  let client: MongoClient;
  let db: Db;
  let OrderPositions: Awaited<ReturnType<typeof OrderPositionsCollection>>;
  let positions: OrderPositionsModule;
  let emitAdapter: EmitAdapter;
  let emitted: string[];

  const configurations = async () =>
    Object.fromEntries(
      (await OrderPositions.find({}, { sort: { _id: 1 } }).toArray()).map(({ _id, configuration }) => [
        _id,
        configuration,
      ]),
    );

  before(async () => {
    // Use MONGO_URL (npm test shares the run's MongoDB), else start a server of its own
    server = process.env.MONGO_URL ? undefined : await MongoMemoryServer.create();
    client = await MongoClient.connect(process.env.MONGO_URL || server.getUri());
    db = client.db('order-positions-test');
    OrderPositions = await OrderPositionsCollection(db);
    positions = configureOrderPositionsModule({ OrderPositions });
    emitAdapter = getEmitAdapter();
    setEmitAdapter({
      // Order events only: npm test runs this next to a platform whose workers emit in the background
      publish(eventName) {
        if (eventName.startsWith('ORDER_')) emitted.push(eventName);
      },
      subscribe: () => undefined,
    });
  });

  beforeEach(async () => {
    emitted = [];
    await OrderPositions.deleteMany({});
    await OrderPositions.insertMany([
      position('p1', 'o1', [
        { key: 'attendees', value: 'Ada, Grace' },
        { key: 'size', value: 'L' },
      ]),
      position('p2', 'o1', [{ key: 'size', value: 'M' }]),
      position('p3', 'o1', null),
      position('p4', 'o2', [{ key: 'attendees', value: 'Linus' }]),
    ]);
  });

  after(async () => {
    setEmitAdapter(emitAdapter);
    await client?.close();
    await server?.stop();
  });

  describe('anonymize', () => {
    it("removes the whole configuration of the order's positions", async () => {
      assert.equal(await positions.anonymize('o1'), 2);

      assert.deepEqual(await configurations(), {
        p1: null,
        p2: null,
        p3: null,
        p4: [{ key: 'attendees', value: 'Linus' }],
      });
      assert.equal(await positions.anonymize('o1'), 0);
      assert.deepEqual(emitted, []);
    });

    it('removes only the parameters with the given keys', async () => {
      assert.equal(await positions.anonymize('o1', { configurationKeys: ['attendees'] }), 1);

      assert.deepEqual(await configurations(), {
        p1: [{ key: 'size', value: 'L' }],
        p2: [{ key: 'size', value: 'M' }],
        p3: null,
        p4: [{ key: 'attendees', value: 'Linus' }],
      });
      assert.equal(await positions.anonymize('o1', { configurationKeys: ['attendees'] }), 0);
      assert.deepEqual(emitted, []);
    });
  });
});
