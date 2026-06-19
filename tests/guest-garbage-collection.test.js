import test from 'node:test';
import assert from 'node:assert';
import { setTimeout } from 'node:timers/promises';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';

let graphqlFetchAsAdmin;
let graphqlFetchAsAnonymous;
let db;

const SIXTY_DAYS_AGO = new Date(Date.now() - 60 * 86400000);

const loginAsGuest = async () => {
  const {
    data: { loginAsGuest: result },
  } = await graphqlFetchAsAnonymous({
    query: /* GraphQL */ `
      mutation LoginAsGuest {
        loginAsGuest {
          _id
          user {
            _id
          }
        }
      }
    `,
  });
  return result.user._id;
};

test.describe('Guest Garbage Collection', () => {
  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsAnonymous = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test('removes stale guests, keeps recent guests and guests with an active cart', async () => {
    // Stale guest with no recent activity -> should be garbage-collected.
    const staleGuestId = await loginAsGuest();
    await db
      .collection('users')
      .updateOne(
        { _id: staleGuestId },
        { $set: { 'lastLogin.timestamp': SIXTY_DAYS_AGO, created: SIXTY_DAYS_AGO } },
      );

    // Recent guest -> should be preserved (activity newer than cutoff).
    const recentGuestId = await loginAsGuest();

    // Stale guest, but with a cart updated recently -> should be preserved
    // (persistent session can keep a cart fresh without re-logging-in).
    const activeCartGuestId = await loginAsGuest();
    await db
      .collection('users')
      .updateOne(
        { _id: activeCartGuestId },
        { $set: { 'lastLogin.timestamp': SIXTY_DAYS_AGO, created: SIXTY_DAYS_AGO } },
      );
    await db.collection('orders').insertOne({
      _id: `cart-${activeCartGuestId}`,
      userId: activeCartGuestId,
      status: null,
      currencyCode: 'CHF',
      countryCode: 'CH',
      created: SIXTY_DAYS_AGO,
      updated: new Date(),
    });

    // Run the worker through the queue (picked up by the IntervalWorker).
    const addWorkResult = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation AddWork($type: WorkType!, $input: JSON) {
          addWork(type: $type, input: $input) {
            _id
            type
          }
        }
      `,
      variables: {
        type: 'GC_GUESTS',
        input: { guestUserMaxAgeInDays: 30 },
      },
    });
    assert.strictEqual(addWorkResult.errors, undefined);
    assert.strictEqual(addWorkResult.data.addWork.type, 'GC_GUESTS');

    await setTimeout(2000);

    const staleGuest = await db.collection('users').findOne({ _id: staleGuestId });
    const recentGuest = await db.collection('users').findOne({ _id: recentGuestId });
    const activeCartGuest = await db.collection('users').findOne({ _id: activeCartGuestId });

    // Stale guest with no orders is permanently deleted by deleteUserService.
    assert.strictEqual(staleGuest, null);
    // Recent guest survives.
    assert.ok(recentGuest);
    assert.strictEqual(recentGuest.deleted ?? null, null);
    // Guest with a freshly updated cart survives untouched.
    assert.ok(activeCartGuest);
    assert.strictEqual(activeCartGuest.deleted ?? null, null);
  });
});
