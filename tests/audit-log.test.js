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

  test.describe('Query.auditLogs filters', () => {
    test('admin can filter audit logs with to date filter', async () => {
      const tomorrow = Date.now() + 86400000;
      const { data, errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query auditLogsTo($to: Timestamp) {
            auditLogs(limit: 10, to: $to) {
              id
              time
            }
          }
        `,
        variables: { to: tomorrow },
      });
      assert.ok(!errors);
      assert.ok(Array.isArray(data.auditLogs));
      for (const entry of data.auditLogs) {
        assert.ok(entry.time <= tomorrow, 'All entries should be before the to date');
      }
    });

    test('admin can filter audit logs with from date filter', async () => {
      const pastDate = Date.now() - 7 * 86400000;
      const { data, errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query auditLogsFrom($from: Timestamp) {
            auditLogs(limit: 10, from: $from) {
              id
              time
            }
          }
        `,
        variables: { from: pastDate },
      });
      assert.ok(!errors);
      assert.ok(Array.isArray(data.auditLogs));
      for (const entry of data.auditLogs) {
        assert.ok(entry.time >= pastDate, 'All entries should be after the from date');
      }
    });

    test('admin can filter audit logs with from and to date range', async () => {
      const from = Date.now() - 7 * 86400000;
      const to = Date.now() + 86400000;
      const { data, errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query auditLogsRange($from: Timestamp, $to: Timestamp) {
            auditLogs(limit: 10, from: $from, to: $to) {
              id
              time
            }
            auditLogsCount(from: $from, to: $to)
          }
        `,
        variables: { from, to },
      });
      assert.ok(!errors);
      assert.ok(Array.isArray(data.auditLogs));
      assert.strictEqual(typeof data.auditLogsCount, 'number');
      for (const entry of data.auditLogs) {
        assert.ok(entry.time >= from && entry.time <= to, 'Entry should be within date range');
      }
    });

    test('admin can filter by classUids', async () => {
      const { data, errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            auditLogs(limit: 10, classUids: [3002]) {
              id
              classUid
            }
          }
        `,
      });
      assert.ok(!errors);
      assert.ok(Array.isArray(data.auditLogs));
      for (const entry of data.auditLogs) {
        assert.strictEqual(entry.classUid, 3002, 'All entries should be authentication events');
      }
    });

    test('admin can filter by success status', async () => {
      const { data, errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            auditLogs(limit: 10, success: true) {
              id
              statusId
            }
          }
        `,
      });
      assert.ok(!errors);
      assert.ok(Array.isArray(data.auditLogs));
      for (const entry of data.auditLogs) {
        assert.strictEqual(entry.statusId, 1, 'All entries should have success status');
      }
    });

    test('admin can filter by userId', async () => {
      const { data, errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            auditLogs(limit: 10, userId: "nonexistent-user-id") {
              id
            }
          }
        `,
      });
      assert.ok(!errors);
      assert.ok(Array.isArray(data.auditLogs));
      assert.strictEqual(data.auditLogs.length, 0, 'No entries for nonexistent user');
    });

    test('admin can search by queryText', async () => {
      const { data, errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            auditLogs(limit: 10, queryText: "Login") {
              id
              message
            }
          }
        `,
      });
      assert.ok(!errors);
      assert.ok(Array.isArray(data.auditLogs));
    });
  });

  test.describe('Query.auditLogsCount with filters', () => {
    test('count respects to date filter', async () => {
      const distantPast = 0;
      const { data, errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query auditLogsCountTo($to: Timestamp) {
            auditLogsCount(to: $to)
          }
        `,
        variables: { to: distantPast },
      });
      assert.ok(!errors);
      assert.strictEqual(data.auditLogsCount, 0, 'No entries before epoch');
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

  test.describe('Audit log export via work queue', () => {
    test('admin can trigger CSV audit log export', async () => {
      const { data, errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON) {
            addWork(type: $type, input: $input) {
              _id
              type
              status
            }
          }
        `,
        variables: {
          type: 'BULK_EXPORT',
          input: { type: 'AUDIT_LOGS', exportCSV: true },
        },
      });
      assert.ok(!errors, `addWork should not error: ${JSON.stringify(errors)}`);
      assert.ok(data.addWork._id, 'Work should be created');
      assert.strictEqual(data.addWork.type, 'BULK_EXPORT');
    });

    test('admin can trigger JSONL audit log export', async () => {
      const { data, errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON) {
            addWork(type: $type, input: $input) {
              _id
              type
              status
            }
          }
        `,
        variables: {
          type: 'BULK_EXPORT',
          input: { type: 'AUDIT_LOGS', exportJSONL: true },
        },
      });
      assert.ok(!errors, `addWork should not error: ${JSON.stringify(errors)}`);
      assert.ok(data.addWork._id, 'Work should be created');
    });

    test('admin can trigger audit log export with filters', async () => {
      const from = Date.now() - 7 * 86400000;
      const to = Date.now() + 86400000;
      const { data, errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON) {
            addWork(type: $type, input: $input) {
              _id
              type
              status
            }
          }
        `,
        variables: {
          type: 'BULK_EXPORT',
          input: {
            type: 'AUDIT_LOGS',
            exportCSV: true,
            from,
            to,
            classUids: [3002],
            success: true,
          },
        },
      });
      assert.ok(!errors, `addWork should not error: ${JSON.stringify(errors)}`);
      assert.ok(data.addWork._id, 'Work should be created with filters');
    });

    test('anonymous user cannot trigger audit log export', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON) {
            addWork(type: $type, input: $input) {
              _id
            }
          }
        `,
        variables: {
          type: 'BULK_EXPORT',
          input: { type: 'AUDIT_LOGS', exportCSV: true },
        },
      });
      assert.ok(errors?.length > 0, 'Anonymous users should not be able to export');
    });
  });
});
