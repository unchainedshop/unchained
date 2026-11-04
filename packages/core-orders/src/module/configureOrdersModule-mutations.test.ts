import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { MongoClient, type Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getEmitAdapter, setEmitAdapter, type EmitAdapter } from '@unchainedshop/events';
import { OrdersCollection, OrderStatus, type Order } from '../db/OrdersCollection.ts';
import { OrderPositionsCollection } from '../db/OrderPositionsCollection.ts';
import {
  configureOrderModuleMutations,
  type OrderMutations,
} from './configureOrdersModule-mutations.ts';

const placedOrder = (_id: string, fields: Partial<Order> = {}): Order => ({
  _id,
  created: new Date('2026-01-01'),
  updated: new Date('2026-01-02'),
  status: OrderStatus.CONFIRMED,
  orderNumber: `NR-${_id}`,
  userId: 'buyer',
  countryCode: 'CH',
  currencyCode: 'CHF',
  calculation: [],
  log: [],
  contact: { emailAddress: 'buyer@example.com', telNumber: '+41791234567' },
  billingAddress: { firstName: 'Ada', lastName: 'Lovelace', city: 'Zürich', countryCode: 'CH' },
  context: {},
  ...fields,
});

describe('configureOrderModuleMutations', () => {
  let server: MongoMemoryServer | undefined;
  let client: MongoClient;
  let db: Db;
  let Orders: Awaited<ReturnType<typeof OrdersCollection>>;
  let orders: OrderMutations;
  let emitAdapter: EmitAdapter;
  let emitted: { eventName: string; payload: Record<string, any> }[];

  before(async () => {
    // Use MONGO_URL (npm test shares the run's MongoDB), else start a server of its own
    server = process.env.MONGO_URL ? undefined : await MongoMemoryServer.create();
    client = await MongoClient.connect(process.env.MONGO_URL || server.getUri());
    db = client.db('orders-mutations-test');
    Orders = await OrdersCollection(db);
    orders = configureOrderModuleMutations({
      Orders,
      OrderPositions: await OrderPositionsCollection(db),
    });
    emitAdapter = getEmitAdapter();
    setEmitAdapter({
      publish(eventName, { payload }) {
        emitted.push({ eventName, payload });
      },
      subscribe: () => undefined,
    });
  });

  beforeEach(async () => {
    emitted = [];
    await Orders.deleteMany({});
  });

  after(async () => {
    setEmitAdapter(emitAdapter);
    await client?.close();
    await server?.stop();
  });

  describe('anonymize', () => {
    it('removes the contact, the billing address and the given context keys', async () => {
      await Orders.insertOne(
        placedOrder('o1', {
          context: { attendees: ['Ada', 'Grace'], marketing: { newsletter: true }, source: 'web' },
        }),
      );

      const order = await orders.anonymize('o1', { contextKeys: ['attendees', 'marketing'] });

      const stored = await Orders.findOne({ _id: 'o1' });
      assert.deepEqual(order, stored);
      assert.equal('contact' in stored!, false);
      assert.equal('billingAddress' in stored!, false);
      assert.deepEqual(stored!.context, { source: 'web' });
      assert.ok(stored!.anonymized instanceof Date);
      assert.ok(stored!.updated! > new Date('2026-01-02'));
      assert.equal(stored!.status, OrderStatus.CONFIRMED);
      assert.equal(stored!.orderNumber, 'NR-o1');
      assert.equal(stored!.userId, 'buyer');
    });

    it('works in every status and emits ORDER_ANONYMIZED with the order id only', async () => {
      const statuses = [null, ...Object.values(OrderStatus)];
      await Orders.insertMany(statuses.map((status, i) => placedOrder(`o${i}`, { status })));

      for (const [i, status] of statuses.entries()) {
        const order = await orders.anonymize(`o${i}`);
        assert.equal(order?.status, status);
        assert.equal(order?.contact, undefined);
        assert.equal(order?.billingAddress, undefined);
      }

      assert.deepEqual(
        emitted,
        statuses.map((_, i) => ({ eventName: 'ORDER_ANONYMIZED', payload: { orderId: `o${i}` } })),
      );
    });

    it('changes and emits nothing when repeated, but removes data added since', async () => {
      await Orders.insertOne(placedOrder('o1', { context: { attendees: ['Ada'] } }));
      const first = await orders.anonymize('o1', { contextKeys: ['attendees'] });

      const repeated = await orders.anonymize('o1', { contextKeys: ['attendees'] });
      assert.deepEqual(repeated, first);
      assert.equal(emitted.length, 1);

      await Orders.updateOne({ _id: 'o1' }, { $set: { contact: { emailAddress: 'new@example.com' } } });
      const again = await orders.anonymize('o1', { contextKeys: ['attendees'] });
      assert.equal(again?.contact, undefined);
      assert.deepEqual(again?.anonymized, first?.anonymized);
      assert.equal(emitted.length, 2);
    });

    it('stamps an order without personal data once', async () => {
      await Orders.insertOne(placedOrder('o1', { contact: undefined, billingAddress: undefined }));

      const order = await orders.anonymize('o1');
      assert.ok(order?.anonymized instanceof Date);
      await orders.anonymize('o1');
      assert.equal(emitted.length, 1);
    });

    it('replaces the whole context with clearContext', async () => {
      await Orders.insertOne(placedOrder('o1', { context: { attendees: ['Ada'], source: 'web' } }));

      const order = await orders.anonymize('o1', { clearContext: true, contextKeys: ['attendees'] });
      assert.deepEqual(order?.context, {});
      await orders.anonymize('o1', { clearContext: true });
      assert.equal(emitted.length, 1);
    });

    it('returns null and emits nothing for an unknown order', async () => {
      assert.equal(await orders.anonymize('unknown'), null);
      assert.equal(emitted.length, 0);
    });
  });

  describe('updateContact', () => {
    it('emits ORDER_UPDATE with the updated order by default', async () => {
      await Orders.insertOne(placedOrder('o1'));

      const order = await orders.updateContact('o1', { emailAddress: 'other@example.com' });

      assert.deepEqual(emitted, [{ eventName: 'ORDER_UPDATE', payload: { order, field: 'contact' } }]);
      assert.deepEqual(order?.contact, { emailAddress: 'other@example.com' });
    });

    it("emits the order id and the changed keys only with eventPayload: 'ids'", async () => {
      await Orders.insertOne(placedOrder('o1'));

      // The national number normalizes to the stored one, so only the e-mail address changed
      const order = await orders.updateContact(
        'o1',
        { emailAddress: 'other@example.com', telNumber: '079 123 45 67' },
        { eventPayload: 'ids' },
      );
      assert.deepEqual(order?.contact, {
        emailAddress: 'other@example.com',
        telNumber: '+41791234567',
      });

      await orders.updateContact('o1', { emailAddress: 'other@example.com' }, { eventPayload: 'ids' });

      assert.deepEqual(emitted, [
        {
          eventName: 'ORDER_UPDATE',
          payload: { orderId: 'o1', field: 'contact', keys: ['emailAddress'] },
        },
        { eventName: 'ORDER_UPDATE', payload: { orderId: 'o1', field: 'contact', keys: ['telNumber'] } },
      ]);
      assert.deepEqual((await Orders.findOne({ _id: 'o1' }))?.contact, {
        emailAddress: 'other@example.com',
      });
    });

    it('returns null and emits nothing for an unknown order', async () => {
      assert.equal(
        await orders.updateContact(
          'unknown',
          { emailAddress: 'a@example.com' },
          { eventPayload: 'ids' },
        ),
        null,
      );
      assert.equal(emitted.length, 0);
    });
  });
});
