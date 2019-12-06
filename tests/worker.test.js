import wait from './lib/wait';
import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';

let connection;
let graphqlFetch;
let workId;

describe('Worker Module', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Happy path', () => {
    it('Standard work gets picked up by the WorkEventListenerWorker.', async () => {
      const addWorkResult = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON) {
            addWork(type: $type, input: $input) {
              _id
              type
            }
          }
        `,
        variables: {
          type: 'HEARTBEAT'
        }
      });

      expect(addWorkResult.errors).toBeUndefined();

      const { data: { workQueue } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query($status: [WorkStatus]) {
            workQueue(status: $status) {
              _id
              status
            }
          }
        `,
        variables: {
          // Empty array as status queries the whole queue
          status: []
        }
      });

      expect(workQueue).toHaveLength(1);

      const work = workQueue.find(
        w => w._id === addWorkResult.data.addWork._id
      );

      expect(work.status).toBe('SUCCESS');
    });

    it('Add simple work that cannot fail for external worker', async () => {
      const { data: { addWork } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON) {
            addWork(type: $type, input: $input) {
              _id
              type
            }
          }
        `,
        variables: {
          type: 'EXTERNAL'
        }
      });

      expect(addWork._id).toBeTruthy();
      expect(addWork.type).toBe('EXTERNAL');
    });

    it('Work in the queue', async () => {
      const { data: { workQueue } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            workQueue {
              _id
            }
          }
        `
      });

      expect(workQueue).toHaveLength(1);
    });

    it('Get work synchroniously. Only one gets it.', async () => {
      const makeAllocatePromise = () =>
        graphqlFetch({
          query: /* GraphQL */ `
            mutation allocateWork($worker: String) {
              allocateWork(worker: $worker) {
                _id
                input
                type
              }
            }
          `,
          variables: {
            worker: 'TEST-GRAPHQL'
          }
        });

      const results = await Promise.all([
        makeAllocatePromise(),
        makeAllocatePromise()
      ]);

      // There should only be one result with allocated work
      expect(
        results.filter(r => r.data.allocateWork && r.data.allocateWork._id)
      ).toHaveLength(1);

      // Hoist workId for later use
      workId = results.find(r => r.data.allocateWork && r.data.allocateWork._id)
        .data.allocateWork._id;
    });

    it('No more work in the queue', async () => {
      const { data: { workQueue } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            workQueue {
              _id
            }
          }
        `
      });

      expect(workQueue).toHaveLength(0);
    });

    it('Finish successful work.', async () => {
      const { data: { finishWork } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation finishWork(
            $workId: ID!
            $success: Boolean
            $worker: String
          ) {
            finishWork(workId: $workId, success: $success, worker: $worker) {
              _id
              status
            }
          }
        `,
        variables: {
          workId,
          success: true,
          worker: 'TEST-GRAPHQL'
        }
      });

      expect(finishWork.status).toBe('SUCCESS');
    });

    it('Do work.', async () => {
      const addWorkResult = await graphqlFetch({
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
          type: 'EXTERNAL'
        }
      });

      expect(addWorkResult.errors).toBeUndefined();

      const allocateWorkResult = await graphqlFetch({
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
          types: ['EXTERNAL']
        }
      });

      expect(allocateWorkResult.errors).toBeUndefined();

      const doWorkResult = await graphqlFetch({
        query: /* GraphQL */ `
          mutation doWork($type: WorkType!, $input: JSON) {
            doWork(type: $type, input: $input) {
              result
              error
              success
            }
          }
        `,
        variables: { type: 'HEARTBEAT' }
      });

      expect(doWorkResult.errors).toBeUndefined();
      expect(doWorkResult.data.doWork.success).toBe(true);

      const finishWorkResult = await graphqlFetch({
        query: /* GraphQL */ `
          mutation finishWork(
            $workId: ID!
            $success: Boolean
            $result: JSON
            $worker: String
          ) {
            finishWork(
              workId: $workId
              success: $success
              result: $result
              worker: $worker
            ) {
              _id
              status
              result
            }
          }
        `,
        variables: {
          workId: addWorkResult.data.addWork._id,
          ...doWorkResult.data.doWork
        }
      });

      expect(finishWorkResult.errors).toBeUndefined();
      expect(finishWorkResult.data.finishWork.status).toBe('SUCCESS');
    });

    it('Add future work', async () => {
      const scheduled = new Date();
      scheduled.setSeconds(scheduled.getSeconds() + 2);

      const addWorkResult = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON, $scheduled: Date) {
            addWork(type: $type, input: $input, scheduled: $scheduled) {
              _id
              type
            }
          }
        `,
        variables: {
          type: 'HEARTBEAT',
          scheduled
        }
      });

      expect(addWorkResult.errors).toBeUndefined();

      const { data: { workQueue: workQueueBefore } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            workQueue {
              _id
              worker
              type
            }
          }
        `
      });

      expect(workQueueBefore).toHaveLength(1);

      // Test if work is not done immediately
      await wait(1000);

      const { data: { workQueue: workQueueMiddle } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            workQueue {
              _id
            }
          }
        `
      });

      expect(workQueueMiddle).toHaveLength(1);

      // Test if work is done eventually
      await wait(2000);

      const { data: { workQueue: workQueueAfter } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            workQueue {
              _id
              worker
            }
          }
        `
      });

      expect(workQueueAfter).toHaveLength(0);
    });

    it('Worker fails and retries', async () => {
      const addWorkResult = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addWork($type: WorkType!, $input: JSON, $retries: Int) {
            addWork(type: $type, input: $input, retries: $retries) {
              _id
              type
            }
          }
        `,
        variables: {
          type: 'HEARTBEAT',
          input: {
            fails: true
          },
          retries: 2
        }
      });

      expect(addWorkResult.errors).toBeUndefined();

      // Hint: If we are super unlucky, the worker already picked up the retry
      // work in this 1 millisecond
      await wait(1);

      // Expect copy & reschedule
      const { data: { workQueue: workQueueBefore } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            workQueue {
              _id
              original
              retries
            }
          }
        `
      });

      expect(workQueueBefore).toHaveLength(1);

      const workBefore = workQueueBefore[0];

      expect(workBefore.original).toBe(addWorkResult.data.addWork._id);
      expect(workBefore.retries).toBe(1);

      // Await the expected reschedule time (should be done by the plugin itself)
      await wait(2000);

      const { data: { workQueue: workQueueAfter } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            workQueue {
              _id
              worker
              retries
              # schedule
            }
          }
        `
      });

      expect(workQueueAfter).toHaveLength(1);
    });

    it.todo('Only admin can interact with worker');
    it.todo('Cleanup Tasks');
  });
});
