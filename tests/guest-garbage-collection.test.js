import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
  runWorkToCompletion,
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

  test('removes stale guests (incl. fresh cart / updated doc), keeps recent guests', async () => {
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

    // Stale guest whose cart was updated recently -> should STILL be collected.
    // A fresh cart is no reprieve: INVALIDATE_CARTS keeps cart `updated` artificially
    // fresh, so it is not a signal of guest presence. The cart is cascade-deleted.
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

    // Stale guest by lastLogin/created whose user document `updated` is recent
    // (e.g. billing/contact saved by a system write) -> should STILL be collected.
    const recentlyUpdatedGuestId = await loginAsGuest();
    await db.collection('users').updateOne(
      { _id: recentlyUpdatedGuestId },
      {
        $set: {
          'lastLogin.timestamp': SIXTY_DAYS_AGO,
          created: SIXTY_DAYS_AGO,
          updated: new Date(),
        },
      },
    );

    // Run the worker through the queue and wait until it actually finishes, so the
    // deletes don't race the next test file's reseed (--test-isolation=none).
    const status = await runWorkToCompletion(graphqlFetchAsAdmin, 'GC_GUESTS', {
      guestUserMaxAgeInDays: 30,
    });
    assert.strictEqual(status, 'SUCCESS');

    const staleGuest = await db.collection('users').findOne({ _id: staleGuestId });
    const recentGuest = await db.collection('users').findOne({ _id: recentGuestId });
    const activeCartGuest = await db.collection('users').findOne({ _id: activeCartGuestId });
    const recentlyUpdatedGuest = await db.collection('users').findOne({ _id: recentlyUpdatedGuestId });
    const activeCart = await db.collection('orders').findOne({ _id: `cart-${activeCartGuestId}` });

    // Stale guest with no orders is permanently deleted by deleteUserService.
    assert.strictEqual(staleGuest, null);
    // Recent guest survives.
    assert.ok(recentGuest);
    assert.strictEqual(recentGuest.deleted ?? null, null);
    // Guest with a freshly updated cart is collected; its cart is cascade-deleted.
    assert.strictEqual(activeCartGuest, null);
    assert.strictEqual(activeCart, null);
    // Guest whose user document `updated` is recent is collected too (ignored signal).
    assert.strictEqual(recentlyUpdatedGuest, null);
  });
});
