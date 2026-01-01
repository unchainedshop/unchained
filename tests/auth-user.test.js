import { setupDatabase, createLoggedInGraphqlFetch, disconnect, getDrizzleDb } from './helpers.js';
import { User, Admin, USER_TOKEN, ADMIN_TOKEN, findOrInsertUserToDrizzle } from './seeds/users.js';
import { events } from '@unchainedshop/core-events';
import { users } from '@unchainedshop/core-users';
import { and, desc, sql, eq } from 'drizzle-orm';
import assert from 'node:assert';
import test from 'node:test';

let drizzleDb;
let graphqlFetch;
let adminGraphqlFetch;

test.describe('Auth for logged in users', () => {
  test.before(async () => {
    await setupDatabase();
    drizzleDb = getDrizzleDb();
    graphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);
    adminGraphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Query.me', () => {
    test('returns currently logged in user', async () => {
      const { data: { me } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            me {
              _id
              name
              profile {
                gender
              }
            }
          }
        `,
      });
      assert.partialDeepStrictEqual(me, {
        _id: User._id,
        profile: {
          gender: 'm',
        },
      });
    });
  });

  test.describe('Query.user', () => {
    test('returns currently logged in user when no userId provided', async () => {
      const { data: { user } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            user {
              _id
              name
            }
          }
        `,
      });
      assert.partialDeepStrictEqual(user, {
        _id: User._id,
      });
    });

    test('does not allow a user to just retrieve data of other users', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query ($userId: ID) {
            user(userId: $userId) {
              _id
            }
          }
        `,
        variables: {
          userId: Admin._id,
        },
      });
      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.sendVerificationEmail', () => {
    test('send verification e-mail', async () => {
      const { data: { sendVerificationEmail } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            sendVerificationEmail(email: "user@unchained.local") {
              success
            }
          }
        `,
      });
      assert.deepStrictEqual(sendVerificationEmail, {
        success: true,
      });
    });

    test('cannot send a verification e-mail to an e-mail not owned by the logged in user', async () => {
      const { data: { sendVerificationEmail } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            sendVerificationEmail(email: "admin@unchained.local") {
              success
            }
          }
        `,
      });
      assert.strictEqual(sendVerificationEmail, null);
    });
  });

  test.describe('Mutation.changePassword', () => {
    test('change own password as user', async () => {
      const { data: { changePassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            changePassword(oldPassword: "password", newPassword: "password") {
              success
            }
          }
        `,
      });
      assert.deepStrictEqual(changePassword, {
        success: true,
      });
    });
  });

  test.describe('Mutation.verifyEmail', () => {
    test.before(async () => {
      await findOrInsertUserToDrizzle(drizzleDb, {
        ...User,
        _id: 'userthatmustverifyemail',
        username: `userthatmustverifyemail-${Date.now()}`,
        emails: [
          {
            address: 'userthatmustverifyemail@unchained.local',
            verified: false,
          },
        ],
      });
    });

    test('create a verification token', async () => {
      const { data: { sendVerificationEmail } = {} } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation {
            sendVerificationEmail(email: "userthatmustverifyemail@unchained.local") {
              success
            }
          }
        `,
      });
      assert.deepStrictEqual(sendVerificationEmail, {
        success: true,
      });
    });

    test('verifies the e-mail of user', async () => {
      // Reset the password with that token
      const drizzleDb = getDrizzleDb();
      const [event] = await drizzleDb
        .select()
        .from(events)
        .where(
          and(
            sql`json_extract(${events.payload}, '$.userId') = ${'userthatmustverifyemail'}`,
            sql`json_extract(${events.payload}, '$.action') = ${'verify-email'}`,
          ),
        )
        .orderBy(desc(events.created))
        .limit(1);

      const token = event.payload.token;

      const { data: { verifyEmail } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation verifyEmail($token: String!) {
            verifyEmail(token: $token) {
              _id
              user {
                _id
              }
            }
          }
        `,
        variables: {
          token,
        },
      });
      assert.partialDeepStrictEqual(verifyEmail, {
        user: {
          _id: 'userthatmustverifyemail',
        },
      });
    });

    test('e-mail is tagged as verified', async () => {
      const [user] = await drizzleDb
        .select()
        .from(users)
        .where(eq(users._id, 'userthatmustverifyemail'))
        .limit(1);
      assert.strictEqual(user.emails[0].verified, true);
    });
  });

  test.describe('Mutation.setUsername for normal user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation setUsername($username: String!, $userId: ID!) {
            setUsername(username: $username, userId: $userId) {
              _id
            }
          }
        `,
        variables: {
          userId: Admin._id,
          username: 'admin-updated',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.logout', () => {
    test('log out userthatlogsout', async () => {
      await findOrInsertUserToDrizzle(drizzleDb, {
        ...User,
        _id: 'userthatlogsout',
        username: 'userthatlogsout',
        emails: [
          {
            address: 'userthatlogsout@unchained.local',
            verified: true,
          },
        ],
        services: {
          ...User.services,
          resume: {
            loginTokens: [
              {
                when: new Date(),
                hashedToken: 'dF4ilYpWpsSvkb7hdZKqsiYa207t2HI+C+HJcowykZk=',
              },
            ],
          },
        },
      });
      const { data: { logout } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation logout {
            logout {
              success
            }
          }
        `,
      });
      assert.deepStrictEqual(logout, {
        success: true,
      });
      const [user] = await drizzleDb
        .select()
        .from(users)
        .where(eq(users._id, 'userthatlogsout'))
        .limit(1);
      const {
        services: {
          resume: { loginTokens },
        },
      } = user;
      assert.strictEqual(loginTokens.length, 1);
    });

    test('log out userthatlogsout without explicit token', async () => {
      await findOrInsertUserToDrizzle(drizzleDb, {
        ...User,
        _id: 'userthatlogsout',
        username: 'userthatlogsout',
        emails: [
          {
            address: 'userthatlogsout@unchained.local',
            verified: true,
          },
        ],
        services: {
          ...User.services,
          resume: {
            loginTokens: [
              {
                when: new Date(),
                hashedToken: 'dF4ilYpWpsSvkb7hdZKqsiYa207t2HI+C+HJcowykZk=',
              },
            ],
          },
        },
      });
      const { data: { logout } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation logout {
            logout {
              success
            }
          }
        `,
        variables: {
          token: 'FWhglvqdNkNX80jZMJ61FvDUkKzCsESVfbui9H8Fg27',
        },
      });
      assert.deepStrictEqual(logout, {
        success: true,
      });
      const [user] = await drizzleDb
        .select()
        .from(users)
        .where(eq(users._id, 'userthatlogsout'))
        .limit(1);
      const {
        services: {
          resume: { loginTokens },
        },
      } = user;
      assert.strictEqual(loginTokens.length, 1);
    });
  });
});
