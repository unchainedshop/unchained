import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';

let graphqlFetchAsAdminUser;
let graphqlFetchAsAnonymousUser;
let graphqlFetchAsNormalUser;

test.describe('Audit Log', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsAdminUser = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Query.auditLogs', () => {
    test('admin can query audit logs', async () => {
      const { data, errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            auditLogs(limit: 10) {
              id
              time
              message
              classUid
              className
              activityId
              typeUid
              severityId
              statusId
              sequenceNumber
            }
          }
        `,
      });
      assert.ok(!errors);
      assert.ok(Array.isArray(data.auditLogs));
    });

    test('anonymous user cannot query audit logs', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query {
            auditLogs(limit: 10) {
              id
            }
          }
        `,
      });
      assert.ok(errors?.length > 0);
    });

    test('normal user cannot query audit logs', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query {
            auditLogs(limit: 10) {
              id
            }
          }
        `,
      });
      assert.ok(errors?.length > 0);
    });
  });

  test.describe('Query.auditLogsCount', () => {
    test('admin can query audit logs count', async () => {
      const { data, errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            auditLogsCount
          }
        `,
      });
      assert.ok(!errors);
      assert.strictEqual(typeof data.auditLogsCount, 'number');
    });
  });

  test.describe('Query.auditChainStatus', () => {
    test('admin can verify chain integrity', async () => {
      const { data, errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            auditChainStatus {
              valid
              totalEntries
              checkedEntries
              errors {
                sequenceNumber
                message
              }
            }
          }
        `,
      });
      assert.ok(!errors);
      assert.strictEqual(data.auditChainStatus.valid, true);
      assert.ok(Array.isArray(data.auditChainStatus.errors));
    });

    test('anonymous user cannot verify chain', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query {
            auditChainStatus {
              valid
            }
          }
        `,
      });
      assert.ok(errors?.length > 0);
    });
  });

  test.describe('Query.failedLoginAttempts', () => {
    test('admin can query failed login attempts', async () => {
      const { data, errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            failedLoginAttempts
          }
        `,
      });
      assert.ok(!errors);
      assert.strictEqual(typeof data.failedLoginAttempts, 'number');
    });
  });

  test.describe('Login emits audit entry', () => {
    test('login produces an authentication audit log entry', async () => {
      // Trigger a login
      const loginResult = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation {
            loginWithPassword(username: "admin", password: "password") {
              _id
              tokenExpires
            }
          }
        `,
      });
      assert.ok(!loginResult.errors, `Login should succeed: ${JSON.stringify(loginResult.errors)}`);

      // Small delay to let the event propagate to the audit log
      await new Promise((resolve) => setTimeout(resolve, 200));

      const { data } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            auditLogs(classUids: [3002], limit: 5) {
              id
              classUid
              className
              activityId
              message
            }
          }
        `,
      });

      assert.ok(data.auditLogs.length > 0);
      const authEntry = data.auditLogs.find((e) => e.className === 'AUTHENTICATION');
      assert.ok(authEntry, 'Should have an AUTHENTICATION audit entry after login');
    });
  });
});
