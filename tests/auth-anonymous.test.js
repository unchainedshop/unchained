import { setupDatabase, disconnect } from './helpers.js';
import { User, ADMIN_TOKEN, findOrInsertUserToDrizzle } from './seeds/users.js';
import { events } from '@unchainedshop/core-events';
import { and, desc, sql } from 'drizzle-orm';
import assert from 'node:assert';
import test from 'node:test';

let graphqlFetch;
let adminGraphqlFetch;
let db;

test.describe('Auth for anonymous users', () => {
  test.before(async () => {
    const {
      createAnonymousGraphqlFetch,
      createLoggedInGraphqlFetch,
      db: drizzleDb,
    } = await setupDatabase();
    graphqlFetch = createAnonymousGraphqlFetch();
    adminGraphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    db = drizzleDb;
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.loginAsGuest', () => {
    test('login as guest', async () => {
      // ensure no e-mail verification gets sent
      const result = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            loginAsGuest {
              _id
              user {
                isGuest
              }
            }
          }
        `,
      });
      const { data: { workQueue } = {} } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          query {
            workQueue {
              _id
              type
              status
            }
          }
        `,
        variables: {},
      });
      const work = workQueue.filter(({ type, status }) => type === 'MESSAGE' && status === 'SUCCESS');
      assert.strictEqual(work.length, 0);
      assert.ok(result.data.loginAsGuest);
      assert.ok(result.data.loginAsGuest?.user?.isGuest);
    });
  });

  test.describe('Mutation.createUser', () => {
    test('create a new user', async () => {
      const birthday = new Date().toISOString().split('T')[0];
      const { data } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createUser(
            $username: String
            $email: String
            $password: String
            $profile: UserProfileInput
          ) {
            createUser(username: $username, email: $email, password: $password, profile: $profile) {
              _id
              user {
                _id
                username
                primaryEmail {
                  address
                }
                profile {
                  birthday
                  displayName
                  phoneMobile
                  gender
                }
              }
            }
          }
        `,
        variables: {
          username: 'newuser',
          email: 'newuser@unchained.local',
          password: 'password',
          profile: {
            displayName: 'New User',
            birthday,
            phoneMobile: '+410000000',
            gender: 'm',
            address: null,
          },
        },
      });
      assert.partialDeepStrictEqual(data.createUser, {
        user: {
          username: 'newuser',
          primaryEmail: {
            address: 'newuser@unchained.local',
          },
          profile: {
            displayName: 'New User',
            birthday,
            phoneMobile: '+410000000',
            gender: 'm',
          },
        },
      });
    });
  });

  test.describe('Mutation.loginWithPassword', () => {
    test('login via username and password', async () => {
      const { data: { loginWithPassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            loginWithPassword(username: "admin", password: "password") {
              _id
              user {
                _id
                username
              }
            }
          }
        `,
      });
      assert.partialDeepStrictEqual(loginWithPassword, {
        user: {
          _id: 'admin',
          username: 'admin',
        },
      });
    });
  });

  test.describe('Mutation.forgotPassword', () => {
    test.before(async () => {
      await findOrInsertUserToDrizzle(db, {
        ...User,
        _id: 'userthatforgetspasswords',
        username: `userthatforgetspasswords-${Date.now()}`,
        emails: [
          {
            address: 'userthatforgetspasswords@unchained.local',
            verified: true,
          },
        ],
      });
    });

    test('create a reset token', async () => {
      const { data: { forgotPassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            forgotPassword(email: "userthatforgetspasswords@unchained.local") {
              success
            }
          }
        `,
      });
      assert.deepStrictEqual(forgotPassword, {
        success: true,
      });
    });
  });

  test.describe('Mutation.resetPassword', () => {
    test.before(async () => {
      await findOrInsertUserToDrizzle(db, {
        ...User,
        _id: 'userthatforgetspasswords',
        username: `userthatforgetspasswords-${Date.now()}`,
        emails: [
          {
            address: 'userthatforgetspasswords@unchained.local',
            verified: true,
          },
        ],
      });
    });

    test('create a reset token', async () => {
      const { data: { forgotPassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            forgotPassword(email: "userthatforgetspasswords@unchained.local") {
              success
            }
          }
        `,
      });
      assert.deepStrictEqual(forgotPassword, {
        success: true,
      });
    });

    test('change password with token from forgotPassword call', async () => {
      // Reset the password with that token
      const [event] = await db
        .select()
        .from(events)
        .where(
          and(
            sql`json_extract(${events.payload}, '$.userId') = ${'userthatforgetspasswords'}`,
            sql`json_extract(${events.payload}, '$.action') = ${'reset-password'}`,
          ),
        )
        .orderBy(desc(events.created))
        .limit(1);

      const token = event.payload.token;

      const { data } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation resetPassword($newPassword: String!, $token: String!) {
            resetPassword(newPassword: $newPassword, token: $token) {
              _id
              user {
                _id
              }
            }
          }
        `,
        variables: {
          newPassword: 'password',
          token,
        },
      });
      assert.partialDeepStrictEqual(data?.resetPassword, {
        user: {
          _id: 'userthatforgetspasswords',
        },
      });
    });
  });
});
