import test from 'node:test';
import assert from 'node:assert';
import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { getTestPlatform } from './setup.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { ConfirmedOrder, ConfirmedOrderPosition } from './seeds/orders.js';

const ORDER = /* GraphQL */ `
  query Order($orderId: ID!) {
    order(orderId: $orderId) {
      _id
      status
      orderNumber
      contact {
        emailAddress
        telNumber
      }
      billingAddress {
        firstName
        lastName
      }
      items {
        _id
        configuration {
          key
          value
        }
      }
      total {
        amount
      }
    }
  }
`;

// The persisted events are written in the background
const findEvents = async (db, filter, count = 1) => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const events = await db.collection('events').find(filter).toArray();
    if (events.length >= count) return events;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return db.collection('events').find(filter).toArray();
};

test.describe('Order personal data', () => {
  let db;
  let modules;
  let adminGraphqlFetch;

  test.before(async () => {
    [db] = await setupDatabase();
    ({ modules } = getTestPlatform().unchainedAPI);
    adminGraphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test('modules.orders.updateContact with eventPayload ids keeps the contact out of the events', async () => {
    const emailAddress = 'new-holder@unchained.local';
    await modules.orders.updateContact(ConfirmedOrder._id, { emailAddress }, { eventPayload: 'ids' });

    const [event] = await findEvents(db, {
      type: 'ORDER_UPDATE',
      'payload.orderId': ConfirmedOrder._id,
    });
    assert.deepStrictEqual(event.payload, {
      orderId: ConfirmedOrder._id,
      field: 'contact',
      keys: ['emailAddress', 'telNumber'],
    });
    assert.strictEqual(JSON.stringify(event).includes(emailAddress), false);

    const {
      data: { order },
    } = await adminGraphqlFetch({ query: ORDER, variables: { orderId: ConfirmedOrder._id } });
    assert.deepStrictEqual(order.contact, { emailAddress, telNumber: null });
  });

  test('modules.orders.anonymize removes the personal data of a confirmed order', async () => {
    await db.collection('order_positions').updateOne(
      { _id: ConfirmedOrderPosition._id },
      {
        $set: {
          configuration: [
            { key: 'attendees', value: 'Hallo Velo' },
            { key: 'size', value: 'L' },
          ],
        },
      },
    );

    const anonymized = await modules.orders.anonymize(ConfirmedOrder._id, { contextKeys: ['hi'] });
    const changedPositions = await modules.orders.positions.anonymize(ConfirmedOrder._id, {
      configurationKeys: ['attendees'],
    });

    assert.ok(anonymized.anonymized instanceof Date);
    assert.deepStrictEqual(anonymized.context, {});
    assert.strictEqual(changedPositions, 1);

    const {
      data: { order },
      errors,
    } = await adminGraphqlFetch({ query: ORDER, variables: { orderId: ConfirmedOrder._id } });
    assert.strictEqual(errors, undefined);
    assert.strictEqual(order.status, 'CONFIRMED');
    assert.strictEqual(order.orderNumber, ConfirmedOrder.orderNumber);
    assert.strictEqual(order.contact, null);
    assert.strictEqual(order.billingAddress, null);
    assert.deepStrictEqual(order.items[0].configuration, [{ key: 'size', value: 'L' }]);
    assert.ok(order.total);

    const events = await findEvents(db, { type: 'ORDER_ANONYMIZED' });
    assert.deepStrictEqual(
      events.map(({ payload }) => payload),
      [{ orderId: ConfirmedOrder._id }],
    );

    // Repeating it changes and emits nothing
    await modules.orders.anonymize(ConfirmedOrder._id, { contextKeys: ['hi'] });
    assert.strictEqual(
      await modules.orders.positions.anonymize(ConfirmedOrder._id, { configurationKeys: ['attendees'] }),
      0,
    );
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.strictEqual(await db.collection('events').countDocuments({ type: 'ORDER_ANONYMIZED' }), 1);
  });
});
