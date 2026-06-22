import test from 'node:test';
import assert from 'node:assert';
import { setTimeout } from 'node:timers/promises';
import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';

let graphqlFetchAsAdmin;
let db;

// Enqueue a work item and wait until it actually finishes. A fixed sleep is unsafe
// here: the zombie killer runs DB-wide deletes, and if it outlives the test it races
// with the next test file's reseed (--test-isolation=none shares the process).
const runWorkToCompletion = async (type) => {
  const { data } = await graphqlFetchAsAdmin({
    query: /* GraphQL */ `
      mutation AddWork($type: WorkType!) {
        addWork(type: $type) {
          _id
        }
      }
    `,
    variables: { type },
  });
  const workId = data.addWork._id;
  for (let i = 0; i < 100; i++) {
    const { data: { work } = {} } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        query Work($workId: ID!) {
          work(workId: $workId) {
            _id
            status
          }
        }
      `,
      variables: { workId },
    });
    if (work?.status === 'SUCCESS' || work?.status === 'FAILED') return work.status;
    await setTimeout(100);
  }
  throw new Error(`Work ${type} did not finish in time`);
};

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

    const status = await runWorkToCompletion('ZOMBIE_KILLER');
    assert.strictEqual(status, 'SUCCESS');

    // Dead cart and its sub-documents are gone.
    assert.strictEqual(await db.collection('orders').findOne({ _id: deadCartId }), null);
    assert.strictEqual(await db.collection('order_positions').findOne({ _id: 'dead-pos-1' }), null);
    assert.strictEqual(await db.collection('order_payments').findOne({ _id: 'dead-pay-1' }), null);

    // Live cart survives.
    assert.ok(await db.collection('orders').findOne({ _id: liveCartId }));
  });
});
