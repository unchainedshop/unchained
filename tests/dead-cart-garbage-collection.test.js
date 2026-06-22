import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  disconnect,
  runWorkToCompletion,
} from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';

let graphqlFetchAsAdmin;
let db;

test.describe('Dead Cart Garbage Collection', () => {
  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test('zombie killer removes carts whose owner no longer exists, with sub-documents', async () => {
    // Dead cart: owner id references a user that does not exist.
    const deadCartId = 'dead-cart-1';
    await db.collection('orders').insertOne({
      _id: deadCartId,
      userId: 'nonexistent-user-xyz',
      status: null,
      currencyCode: 'CHF',
      countryCode: 'CH',
      created: new Date(),
      updated: new Date(),
    });
    await db
      .collection('order_positions')
      .insertOne({ _id: 'dead-pos-1', orderId: deadCartId, productId: 'simpleproduct', quantity: 1 });
    await db
      .collection('order_payments')
      .insertOne({ _id: 'dead-pay-1', orderId: deadCartId, status: 'OPEN' });

    // Live cart: owner exists (the seeded admin user).
    const liveCartId = 'live-cart-1';
    await db.collection('orders').insertOne({
      _id: liveCartId,
      userId: 'admin',
      status: null,
      currencyCode: 'CHF',
      countryCode: 'CH',
      created: new Date(),
      updated: new Date(),
    });

    const status = await runWorkToCompletion(graphqlFetchAsAdmin, 'ZOMBIE_KILLER');
    assert.strictEqual(status, 'SUCCESS');

    // Dead cart and its sub-documents are gone.
    assert.strictEqual(await db.collection('orders').findOne({ _id: deadCartId }), null);
    assert.strictEqual(await db.collection('order_positions').findOne({ _id: 'dead-pos-1' }), null);
    assert.strictEqual(await db.collection('order_payments').findOne({ _id: 'dead-pay-1' }), null);

    // Live cart survives.
    assert.ok(await db.collection('orders').findOne({ _id: liveCartId }));
  });
});
