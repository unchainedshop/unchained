import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';

let graphqlFetchAsAdmin;
let graphqlFetchAsUser;
let graphqlFetchAsAnonymous;

test.describe('Impersonation', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymous = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.impersonate for admin user', () => {
    test('should allow admin to impersonate another user', async () => {
      const {
        data: { impersonate },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation Impersonate($userId: ID!) {
            impersonate(userId: $userId) {
              _id
              user {
                _id
                username
              }
            }
          }
        `,
        variables: {
          userId: 'user',
        },
      });

      assert.ok(impersonate);
      assert.strictEqual(impersonate.user._id, 'user');
      assert.strictEqual(impersonate.user.username, 'user');
    });

    test('should return error when impersonating non-existing user', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation Impersonate($userId: ID!) {
            impersonate(userId: $userId) {
              _id
              user {
                _id
              }
            }
          }
        `,
        variables: {
          userId: 'non-existing-user',
        },
      });

      assert.ok(errors);
      assert.ok(errors.length > 0);
    });
  });

  test.describe('Mutation.impersonate for normal user', () => {
    test('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation Impersonate($userId: ID!) {
            impersonate(userId: $userId) {
              _id
              user {
                _id
              }
            }
          }
        `,
        variables: {
          userId: 'admin',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.impersonate for anonymous user', () => {
    test('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymous({
        query: /* GraphQL */ `
          mutation Impersonate($userId: ID!) {
            impersonate(userId: $userId) {
              _id
              user {
                _id
              }
            }
          }
        `,
        variables: {
          userId: 'user',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });
});
