import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Collection } from 'mongodb';
import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';

test('order lists batch relations while preserving stable item/discount order and missing relations', async () => {
  const [db] = await setupDatabase();
  const ids = ['batch-order-1', 'batch-order-2', 'batch-order-3'];
  const created = new Date('2026-01-01');
  await db.collection('orders').insertMany(
    ids.map((_id, index) => ({
      _id,
      created,
      userId: 'admin',
      status: 'CONFIRMED',
      orderNumber: _id,
      currencyCode: 'CHF',
      countryCode: 'CH',
      ...(index < 2 && { deliveryId: `${_id}-delivery`, paymentId: `${_id}-payment` }),
    })),
  );
  for (const orderId of ids.slice(0, 2)) {
    await db.collection('order_positions').insertMany([
      { _id: `${orderId}-b`, orderId, created, quantity: 1 },
      { _id: `${orderId}-a`, orderId, created, quantity: 1 },
      { _id: `${orderId}-removed`, orderId, created, quantity: 0 },
    ]);
    await db.collection('order_discounts').insertMany([
      { _id: `${orderId}-b`, orderId, created },
      { _id: `${orderId}-a`, orderId, created },
    ]);
    await db.collection('order_deliveries').insertOne({ _id: `${orderId}-delivery`, orderId });
    await db.collection('order_payments').insertOne({ _id: `${orderId}-payment`, orderId });
  }
  await db.collection('enrollments').insertMany([
    { _id: 'batch-deleted', deleted: created, periods: [{ orderId: ids[0] }] },
    { _id: 'batch-enrollment', periods: ids.slice(0, 2).map((orderId) => ({ orderId })) },
  ]);

  const queries = new Map(
    ['order_positions', 'order_discounts', 'order_deliveries', 'order_payments', 'enrollments'].map(
      (name) => [name, 0],
    ),
  );
  const find = Collection.prototype.find;
  Collection.prototype.find = function (...args) {
    if (queries.has(this.collectionName)) {
      queries.set(this.collectionName, queries.get(this.collectionName)! + 1);
    }
    return find.apply(this, args);
  };
  try {
    const { data, errors } = await createLoggedInGraphqlFetch(ADMIN_TOKEN)({
      query: /* GraphQL */ `
        query {
          orders(limit: 100) {
            _id
            items {
              _id
            }
            discounts {
              _id
            }
            delivery {
              _id
            }
            payment {
              _id
            }
            enrollment {
              _id
            }
          }
        }
      `,
    });
    assert.equal(errors, undefined);
    for (const [collection, count] of queries) assert.equal(count, 1, `${collection} must batch`);
    for (const orderId of ids.slice(0, 2)) {
      const order = data.orders.find((candidate) => candidate._id === orderId);
      assert.deepEqual(
        order.items.map(({ _id }) => _id),
        [`${orderId}-a`, `${orderId}-b`],
      );
      assert.deepEqual(
        order.discounts.map(({ _id }) => _id),
        [`${orderId}-a`, `${orderId}-b`],
      );
      assert.equal(order.delivery._id, `${orderId}-delivery`);
      assert.equal(order.payment._id, `${orderId}-payment`);
      assert.equal(order.enrollment._id, 'batch-enrollment');
    }
    const empty = data.orders.find((candidate) => candidate._id === ids[2]);
    assert.deepEqual(empty.items, []);
    assert.deepEqual(empty.discounts, []);
    assert.equal(empty.delivery, null);
    assert.equal(empty.payment, null);
    assert.equal(empty.enrollment, null);
  } finally {
    Collection.prototype.find = find;
  }
});
