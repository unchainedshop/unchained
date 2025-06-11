import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { AllocatedWork, NewWork } from './seeds/work.js';
import { USER_TOKEN, ADMIN_TOKEN } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';

let graphqlFetchAsAdminUser;
let graphqlFetchAsNormalUser;
let graphqlFetchAsAnonymousUser;
let workId;

test.describe('Work Queue', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsAdminUser = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Happy path', () => {
    test('Standard work gets picked up by the IntervalWorker.', async () => {
      const addWorkResult = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON) {
            addWork(type: $type, input: $input) {
              _id
              type
            }
          }
        `,
        variables: {
          type: 'HEARTBEAT',
        },
      });

      assert.strictEqual(addWorkResult.data.addWork.type, 'HEARTBEAT');
      assert.strictEqual(addWorkResult.errors, undefined);

      await setTimeout(1000);

      const { data: { workQueue } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            workQueue(status: [SUCCESS]) {
              _id
              type
              status
            }
          }
        `,
      });

      assert.strictEqual(workQueue.filter(({ type }) => type === 'HEARTBEAT').length, 1);

      const work = workQueue.find((w) => w._id === addWorkResult.data.addWork._id);

      assert.strictEqual(work.status, 'SUCCESS');
    });

    test('Add simple work that cannot fail for external worker', async () => {
      const { data: { addWork } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON) {
            addWork(type: $type, input: $input) {
              _id
              type
            }
          }
        `,
        variables: {
          type: 'EXTERNAL',
        },
      });

      assert.ok(addWork._id);
      assert.strictEqual(addWork.type, 'EXTERNAL');
    });

    test('Work in the queue', async () => {
      const { data: { workQueue } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query workQueue($created: DateFilterInput) {
            workQueue(created: $created, status: []) {
              _id
              type
            }
          }
        `,
        variables: {
          created: { start: new Date(0), end: null },
        },
      });
      assert.strictEqual(workQueue.filter(({ type }) => type === 'EXTERNAL').length, 3);
    });

    test('Return search result in work queue', async () => {
      const { data: { workQueue } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query workQueue($queryString: String) {
            workQueue(queryString: $queryString, status: []) {
              _id
              type
            }
          }
        `,
        variables: {
          queryString: 'external',
        },
      });
      assert.strictEqual(workQueue.length, 3);
    });

    test('Get work synchroniously. Only one gets it.', async () => {
      const makeAllocatePromise = () =>
        graphqlFetchAsAdminUser({
          query: /* GraphQL */ `
            mutation allocateWork($types: [WorkType], $worker: String) {
              allocateWork(types: $types, worker: $worker) {
                _id
                input
                type
              }
            }
          `,
          variables: {
            worker: 'TEST-GRAPHQL',
            types: ['EXTERNAL'],
          },
        });

      const results = await Promise.all([makeAllocatePromise(), makeAllocatePromise()]);

      // There should only be one result with allocated work
      assert.strictEqual(
        results.filter(
          (r) =>
            r.data.allocateWork && r.data.allocateWork.type === 'EXTERNAL' && r.data.allocateWork._id,
        ).length,
        1,
      );

      // Hoist workId for later use
      workId = results.find((r) => r.data.allocateWork && r.data.allocateWork._id).data.allocateWork._id;
    });

    test('No more work in the queue', async () => {
      const { data: { workQueue } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            workQueue(status: [NEW]) {
              _id
              type
            }
          }
        `,
      });

      assert.strictEqual(workQueue.filter(({ type }) => type === 'HEARTBEAT').length, 0);
    });

    test('Finish successful work.', async () => {
      const { data: { finishWork } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation finishWork($workId: ID!, $success: Boolean, $worker: String) {
            finishWork(workId: $workId, success: $success, worker: $worker) {
              _id
              status
            }
          }
        `,
        variables: {
          workId,
          success: true,
          worker: 'TEST-GRAPHQL',
        },
      });

      assert.strictEqual(finishWork.status, 'SUCCESS');
    });

    test('return error when passed invalid workId', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation finishWork($workId: ID!, $success: Boolean, $worker: String) {
            finishWork(workId: $workId, success: $success, worker: $worker) {
              _id
            }
          }
        `,
        variables: {
          workId: '',
          success: true,
          worker: 'TEST-GRAPHQL',
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });

    test('return not found error when non existing workId', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation finishWork($workId: ID!, $success: Boolean, $worker: String) {
            finishWork(workId: $workId, success: $success, worker: $worker) {
              _id
            }
          }
        `,
        variables: {
          workId: 'invalid-work-id',
          success: true,
          worker: 'TEST-GRAPHQL',
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'WorkNotFoundOrWrongStatus');
    });

    test('Do work.', async () => {
      const addWorkResult = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON) {
            addWork(type: $type, input: $input) {
              _id
              type
              input
            }
          }
        `,
        variables: {
          type: 'EXTERNAL',
        },
      });

      assert.strictEqual(addWorkResult.data.addWork.type, 'EXTERNAL');
      assert.strictEqual(addWorkResult.errors, undefined);

      const allocateWorkResult = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation allocateWork($types: [WorkType], $worker: String) {
            allocateWork(worker: $worker, types: $types) {
              _id
              input
              type
            }
          }
        `,
        variables: {
          worker: 'TEST-GRAPHQL',
          types: ['EXTERNAL'],
        },
      });

      assert.strictEqual(allocateWorkResult.errors, undefined);

      const finishWorkResult = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation finishWork($workId: ID!, $success: Boolean, $result: JSON, $worker: String) {
            finishWork(workId: $workId, success: $success, result: $result, worker: $worker) {
              _id
              status
              result
            }
          }
        `,
        variables: {
          workId: addWorkResult.data.addWork._id,
          success: true,
          result: {},
          worker: 'TEST-GRAPHQL',
        },
      });

      assert.strictEqual(finishWorkResult.errors, undefined);
      assert.strictEqual(finishWorkResult.data.finishWork.status, 'SUCCESS');
    });

    test('Add future work', async () => {
      const scheduled = new Date();
      scheduled.setSeconds(scheduled.getSeconds() + 1);

      const addWorkResult = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON, $scheduled: Timestamp) {
            addWork(type: $type, input: $input, scheduled: $scheduled) {
              _id
              status
              type
              started
            }
          }
        `,
        variables: {
          type: 'HEARTBEAT',
          scheduled,
        },
      });

      assert.strictEqual(addWorkResult.data.addWork.type, 'HEARTBEAT');
      assert.strictEqual(addWorkResult.errors, undefined);

      // Test if work is done eventually
      await setTimeout(3000);

      const { data: { workQueue } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            workQueue: workQueue(status: [NEW, SUCCESS]) {
              _id
              status
              started
              type
              worker
            }
          }
        `,
      });

      assert.strictEqual(
        workQueue.filter(({ type, status }) => type === 'HEARTBEAT' && status === 'NEW').length,
        0,
      );

      assert.strictEqual(
        workQueue.filter(
          ({ type, status, started }) =>
            type === 'HEARTBEAT' &&
            status === 'SUCCESS' &&
            new Date(started).getTime() >= scheduled.getTime(),
        ).length,
        1,
      );
    });

    test('Worker fails and retries', async () => {
      const addWorkResult = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON, $retries: Int) {
            addWork(type: $type, input: $input, retries: $retries) {
              _id
              status
              type
              worker
            }
          }
        `,
        variables: {
          type: 'HEARTBEAT',
          input: {
            fails: true,
          },
          retries: 2,
        },
      });

      assert.strictEqual(addWorkResult.errors, undefined);

      await setTimeout(3000);

      // Expect copy & reschedule
      const { data: { workQueue: workQueue } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            workQueue(status: [NEW, ALLOCATED, FAILED]) {
              _id
              status
              type
              worker
              original {
                _id
              }
              retries
            }
          }
        `,
      });

      assert.strictEqual(
        workQueue.filter(({ type, _id, original, retries }) => {
          if (type !== 'HEARTBEAT') return false;
          if (retries === 2 && _id === addWorkResult.data.addWork._id) return true;
          if (retries === 1 && original._id === addWorkResult.data.addWork._id) return true;
        }).length,
        2,
      );
    });
  });

  test.describe('mutation.addWork for normal user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON) {
            addWork(type: $type, input: $input) {
              _id
              type
            }
          }
        `,
        variables: {
          type: 'HEARTBEAT',
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.addWork for anonymous user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON) {
            addWork(type: $type, input: $input) {
              _id
              type
            }
          }
        `,
        variables: {
          type: 'HEARTBEAT',
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('query.workQueue for admin user should', () => {
    test('should return all work type and status in the system', async () => {
      const {
        data: { workQueue },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            workQueue {
              _id
              type
              status
            }
          }
        `,
      });
      assert.strictEqual(workQueue.length > 0, true);
    });

    test('should return only works that match the type provided', async () => {
      const {
        data: { workQueue },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query ($status: [WorkStatus!], $types: [WorkType!]) {
            workQueue(status: $status, types: $types) {
              _id
              type
              status
            }
          }
        `,
        variables: {
          types: ['EXTERNAL'],
        },
      });
      assert.strictEqual(workQueue.filter((e) => e.type !== 'EXTERNAL').length, 0);
    });

    test('should return only works that match the status provided', async () => {
      const {
        data: { workQueue },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query ($status: [WorkStatus!], $types: [WorkType!]) {
            workQueue(status: $status, types: $types) {
              _id
              type
              status
            }
          }
        `,
        variables: {
          status: ['SUCCESS'],
        },
      });
      assert.strictEqual(workQueue.filter((e) => e.status !== 'SUCCESS').length, 0);
    });

    test('should only return work types that match status and type provided', async () => {
      const {
        data: { workQueue },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query ($status: [WorkStatus!], $types: [WorkType!]) {
            workQueue(status: $status, types: $types) {
              _id
              type
              status
            }
          }
        `,
        variables: {
          status: ['SUCCESS'],
          types: ['EXTERNAL'],
        },
      });
      assert.strictEqual(
        workQueue.filter((w) => w.type !== 'EXTERNAL' || w.status !== 'SUCCESS').length,
        0,
      );
    });
  });

  test.describe('query.workQueue for normal user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query {
            workQueue {
              _id
              type
              status
            }
          }
        `,
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('query.workQueue for anonymous user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query {
            workQueue {
              _id
              type
              status
            }
          }
        `,
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('query.activeWorkTypes for admin user should', () => {
    test('return all the registered active work types', async () => {
      const {
        data: { activeWorkTypes },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            activeWorkTypes
          }
        `,
        variables: {
          limit: 10,
        },
      });

      assert.strictEqual(activeWorkTypes.length > 0, true);
    });
  });

  test.describe('query.activeWorkTypes for normal user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query {
            activeWorkTypes
          }
        `,
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('query.activeWorkTypes for anonymous user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query {
            activeWorkTypes
          }
        `,
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.allocateWork for normal user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation allocateWork($types: [WorkType], $worker: String) {
            allocateWork(types: $types, worker: $worker) {
              _id
              input
              type
            }
          }
        `,
        variables: {
          worker: 'TEST-GRAPHQL',
          types: ['EXTERNAL'],
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.allocateWork for anonymous user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation allocateWork($types: [WorkType], $worker: String) {
            allocateWork(types: $types, worker: $worker) {
              _id
              input
              type
            }
          }
        `,
        variables: {
          worker: 'TEST-GRAPHQL',
          types: ['EXTERNAL'],
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.finishWork for normal user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation finishWork($workId: ID!, $success: Boolean, $worker: String) {
            finishWork(workId: $workId, success: $success, worker: $worker) {
              _id
              status
            }
          }
        `,
        variables: {
          workId,
          success: true,
          worker: 'TEST-GRAPHQL',
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.finishWork for anonymous user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation finishWork($workId: ID!, $success: Boolean, $worker: String) {
            finishWork(workId: $workId, success: $success, worker: $worker) {
              _id
              status
            }
          }
        `,
        variables: {
          workId,
          success: true,
          worker: 'TEST-GRAPHQL',
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Query.work for admin user should', () => {
    test("return the work specified by it's ID", async () => {
      const {
        data: { work },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query work($workId: ID!) {
            work(workId: $workId) {
              _id
              started
              finished
              updated
              deleted
              priority
              type
              status
              worker
              input
              result
              error
              success
              retries
              timeout
              worker

              original {
                _id
              }
            }
          }
        `,
        variables: {
          workId: NewWork._id,
        },
      });
      delete NewWork.created;
      delete NewWork.scheduled;
      assert.partialDeepStrictEqual(work, NewWork);
    });

    test('return work as null when passed non-existing work ID', async () => {
      const {
        data: { work },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query work($workId: ID!) {
            work(workId: $workId) {
              _id
            }
          }
        `,
        variables: {
          workId: 'non-existing-id',
        },
      });
      assert.strictEqual(work, null);
    });

    test('return InvalidIdError when passed invalid work ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query work($workId: ID!) {
            work(workId: $workId) {
              _id
            }
          }
        `,
        variables: {
          workId: '',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Query.work for normal user should', () => {
    test('return NoPermissionError ', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query work($workId: ID!) {
            work(workId: $workId) {
              _id
            }
          }
        `,
        variables: {
          workId: NewWork._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Query.work for anonymous user should', () => {
    test('return NoPermissionError ', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query work($workId: ID!) {
            work(workId: $workId) {
              _id
            }
          }
        `,
        variables: {
          workId: NewWork._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.removeWork for admin user should', () => {
    test("return the work specified by it's ID", async () => {
      const {
        data: { removeWork },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation removeWork($workId: ID!) {
            removeWork(workId: $workId) {
              _id
              started
              finished
              created
              updated
              deleted
              priority
              type
              status
              worker
              input
              result
              error
              success
              scheduled
              retries
              timeout
            }
          }
        `,
        variables: {
          workId: AllocatedWork._id,
        },
      });
      assert.notStrictEqual(removeWork.deleted, null);
    });

    test('return WorkNotFoundOrWrongStatus when passed non-existing work ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation removeWork($workId: ID!) {
            removeWork(workId: $workId) {
              _id
            }
          }
        `,
        variables: {
          workId: 'non-existing-id',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'WorkNotFoundOrWrongStatus');
    });

    test('return InvalidIdError when passed invalid work ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation removeWork($workId: ID!) {
            removeWork(workId: $workId) {
              _id
            }
          }
        `,
        variables: {
          workId: '',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.removeWork for normal user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation removeWork($workId: ID!) {
            removeWork(workId: $workId) {
              _id
            }
          }
        `,
        variables: {
          workId: AllocatedWork._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.removeWork for anonymous user should', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation removeWork($workId: ID!) {
            removeWork(workId: $workId) {
              _id
            }
          }
        `,
        variables: {
          workId: AllocatedWork._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });
});
