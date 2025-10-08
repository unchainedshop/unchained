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

test.describe('User Removal', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymous = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.removeUser for admin user', () => {
    test('should remove a user', async () => {
      const {
        data: { createUser },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation CreateUser($username: String!, $email: String!, $password: String!) {
            createUser(username: $username, email: $email, password: $password) {
              _id
              user {
                _id
                username
              }
            }
          }
        `,
        variables: {
          username: 'testuser1',
          email: 'testuser1@example.com',
          password: 'password123',
        },
      });

      const userId = createUser.user._id;

      const {
        data: { removeUser },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation RemoveUser($userId: ID!) {
            removeUser(userId: $userId) {
              _id
              username
            }
          }
        `,
        variables: {
          userId,
        },
      });

      assert.ok(removeUser);
      assert.strictEqual(removeUser._id, userId);
    });

    test('should return error when removing non-existing user', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation RemoveUser($userId: ID!) {
            removeUser(userId: $userId) {
              _id
            }
          }
        `,
        variables: {
          userId: 'non-existing-user-id',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'UserNotFoundError');
    });

    test.todo('Should remove user without removing its review');
    test.todo('Should remove user and its review');
  });

  test.describe('Mutation.removeUser for normal user', () => {
    test('should return NoPermissionError when removing another user', async () => {
      const { errors } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation RemoveUser($userId: ID!) {
            removeUser(userId: $userId) {
              _id
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

  test.describe('Mutation.removeUser for anonymous user', () => {
    test('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymous({
        query: /* GraphQL */ `
          mutation RemoveUser($userId: ID!) {
            removeUser(userId: $userId) {
              _id
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
