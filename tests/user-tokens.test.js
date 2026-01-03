import test from 'node:test';
import assert from 'node:assert';
import { setupDatabase, disconnect } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { events } from '@unchainedshop/core-events';
import { users } from '@unchainedshop/core-users';
import { and, desc, sql, eq } from 'drizzle-orm';

let graphqlFetchAsAnonymousUser;
let graphqlFetchAsAdminUser;
let resetPasswordToken;
let verifyEmailToken;
let db;

test.describe('User Token Validation', () => {
  test.before(async () => {
    const {
      createLoggedInGraphqlFetch,
      createAnonymousGraphqlFetch,
      db: drizzleDb,
    } = await setupDatabase();
    db = drizzleDb;
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
    graphqlFetchAsAdminUser = createLoggedInGraphqlFetch(ADMIN_TOKEN);

    // Create test users in Drizzle
    const [existingResetUser] = await db
      .select()
      .from(users)
      .where(eq(users._id, 'user-reset-password'))
      .limit(1);

    if (!existingResetUser) {
      await db.insert(users).values({
        _id: 'user-reset-password',
        username: `resetuser${Math.random()}`,
        emails: [
          {
            address: 'resettest@unchained.local',
            verified: false,
          },
        ],
        guest: false,
        roles: [],
        pushSubscriptions: [],
        created: new Date(),
      });
    }

    const [existingVerifyUser] = await db
      .select()
      .from(users)
      .where(eq(users._id, 'user-verify-email'))
      .limit(1);

    if (!existingVerifyUser) {
      await db.insert(users).values({
        _id: 'user-verify-email',
        username: `verifyuser${Math.random()}`,
        emails: [
          {
            address: 'verifytest@unchained.local',
            verified: false,
          },
        ],
        guest: false,
        roles: [],
        pushSubscriptions: [],
        created: new Date(),
      });
    }

    await graphqlFetchAsAnonymousUser({
      query: /* GraphQL */ `
        mutation {
          forgotPassword(email: "resettest@unchained.local") {
            success
          }
        }
      `,
    });

    const [resetEvent] = await db
      .select()
      .from(events)
      .where(
        and(
          sql`json_extract(${events.payload}, '$.userId') = ${'user-reset-password'}`,
          sql`json_extract(${events.payload}, '$.action') = ${'reset-password'}`,
        ),
      )
      .orderBy(desc(events.created))
      .limit(1);
    resetPasswordToken = resetEvent?.payload?.token;

    await graphqlFetchAsAdminUser({
      query: /* GraphQL */ `
        mutation {
          sendVerificationEmail(email: "verifytest@unchained.local") {
            success
          }
        }
      `,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const [verifyEvent] = await db
      .select()
      .from(events)
      .where(
        and(
          sql`json_extract(${events.payload}, '$.userId') = ${'user-verify-email'}`,
          sql`json_extract(${events.payload}, '$.action') = ${'verify-email'}`,
        ),
      )
      .orderBy(desc(events.created))
      .limit(1);
    verifyEmailToken = verifyEvent?.payload?.token;

    if (!resetPasswordToken) {
      throw new Error('Reset password token was not generated');
    }
    if (!verifyEmailToken) {
      throw new Error('Verify email token was not generated');
    }
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Query.validateResetPasswordToken', () => {
    test('Return true for valid reset password token', async () => {
      const {
        data: { validateResetPasswordToken },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query ValidateResetPasswordToken($token: String!) {
            validateResetPasswordToken(token: $token)
          }
        `,
        variables: {
          token: resetPasswordToken,
        },
      });
      assert.strictEqual(validateResetPasswordToken, true);
    });

    test('Return false for invalid token', async () => {
      const {
        data: { validateResetPasswordToken },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query ValidateResetPasswordToken($token: String!) {
            validateResetPasswordToken(token: $token)
          }
        `,
        variables: {
          token: 'invalid-token',
        },
      });
      assert.strictEqual(validateResetPasswordToken, false);
    });

    test('Return false for empty token', async () => {
      const {
        data: { validateResetPasswordToken },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query ValidateResetPasswordToken($token: String!) {
            validateResetPasswordToken(token: $token)
          }
        `,
        variables: {
          token: '',
        },
      });
      assert.strictEqual(validateResetPasswordToken, false);
    });

    test('Return false after password is reset', async () => {
      await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation ResetPassword($token: String!, $newPassword: String!) {
            resetPassword(token: $token, newPassword: $newPassword) {
              _id
            }
          }
        `,
        variables: {
          token: resetPasswordToken,
          newPassword: 'newSecurePassword123!',
        },
      });

      const {
        data: { validateResetPasswordToken },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query ValidateResetPasswordToken($token: String!) {
            validateResetPasswordToken(token: $token)
          }
        `,
        variables: {
          token: resetPasswordToken,
        },
      });
      assert.strictEqual(validateResetPasswordToken, false);
    });
  });

  test.describe('Query.validateVerifyEmailToken', () => {
    test('Return true for valid verify email token', async () => {
      const {
        data: { validateVerifyEmailToken },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query ValidateVerifyEmailToken($token: String!) {
            validateVerifyEmailToken(token: $token)
          }
        `,
        variables: {
          token: verifyEmailToken,
        },
      });
      assert.strictEqual(validateVerifyEmailToken, true);
    });

    test('Return false for invalid verify email token', async () => {
      const {
        data: { validateVerifyEmailToken },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query ValidateVerifyEmailToken($token: String!) {
            validateVerifyEmailToken(token: $token)
          }
        `,
        variables: {
          token: 'invalid-token',
        },
      });
      assert.strictEqual(validateVerifyEmailToken, false);
    });

    test('Return false for empty token', async () => {
      const {
        data: { validateVerifyEmailToken },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query ValidateVerifyEmailToken($token: String!) {
            validateVerifyEmailToken(token: $token)
          }
        `,
        variables: {
          token: '',
        },
      });
      assert.strictEqual(validateVerifyEmailToken, false);
    });

    test('Return false after token is used', async () => {
      await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation VerifyEmail($token: String!) {
            verifyEmail(token: $token) {
              _id
            }
          }
        `,
        variables: {
          token: verifyEmailToken,
        },
      });

      const {
        data: { validateVerifyEmailToken },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query ValidateVerifyEmailToken($token: String!) {
            validateVerifyEmailToken(token: $token)
          }
        `,
        variables: {
          token: verifyEmailToken,
        },
      });
      assert.strictEqual(validateVerifyEmailToken, false);
    });
  });
});
