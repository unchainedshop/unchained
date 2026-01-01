import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { Admin } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';

// API key format: username:secret
// The admin user has setAccessToken('admin', 'secret') called in setup.js
const API_KEY_TOKEN = 'Bearer admin:secret';

let apiKeyGraphqlFetch;

test.describe('API Key Authentication', () => {
  test.before(async () => {
    await setupDatabase();
    apiKeyGraphqlFetch = createLoggedInGraphqlFetch(API_KEY_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Query.me with API key', () => {
    test('returns the admin user when authenticated with API key', async () => {
      const { data: { me } = {} } = await apiKeyGraphqlFetch({
        query: /* GraphQL */ `
          query {
            me {
              _id
              username
              roles
            }
          }
        `,
      });
      assert.partialDeepStrictEqual(me, {
        _id: Admin._id,
        username: 'admin',
        roles: ['admin'],
      });
    });
  });

  test.describe('Query.user with API key', () => {
    test('returns the admin user data', async () => {
      const { data: { user } = {} } = await apiKeyGraphqlFetch({
        query: /* GraphQL */ `
          query {
            user {
              _id
              username
            }
          }
        `,
      });
      assert.partialDeepStrictEqual(user, {
        _id: Admin._id,
        username: 'admin',
      });
    });

    test('allows admin to query other users', async () => {
      const { data: { user } = {} } = await apiKeyGraphqlFetch({
        query: /* GraphQL */ `
          query ($userId: ID) {
            user(userId: $userId) {
              _id
              username
            }
          }
        `,
        variables: {
          userId: 'user',
        },
      });
      assert.partialDeepStrictEqual(user, {
        _id: 'user',
        username: 'user',
      });
    });
  });

  test.describe('Invalid API key', () => {
    test('returns null user for invalid API key', async () => {
      const invalidKeyFetch = createLoggedInGraphqlFetch('Bearer admin:wrongsecret');
      const { data: { me } = {} } = await invalidKeyFetch({
        query: /* GraphQL */ `
          query {
            me {
              _id
            }
          }
        `,
      });
      assert.strictEqual(me, null);
    });

    test('returns null user for malformed API key', async () => {
      const malformedKeyFetch = createLoggedInGraphqlFetch('Bearer notavalidtoken');
      const { data: { me } = {} } = await malformedKeyFetch({
        query: /* GraphQL */ `
          query {
            me {
              _id
            }
          }
        `,
      });
      assert.strictEqual(me, null);
    });
  });
});
