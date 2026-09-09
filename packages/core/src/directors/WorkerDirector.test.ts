import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it, type TestContext } from 'node:test';
import { MongoClient, type CommandSucceededEvent } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { configureWorkerModule } from '../../../core-worker/src/module/configureWorkerModule.ts';
import { acquireLock, OrderLocksCollection } from '../../../core-orders/src/db/OrderLocksCollection.ts';
import { WorkerDirector } from './WorkerDirector.ts';
import { WorkerAdapter, type IWorkerAdapter } from './WorkerAdapter.ts';

type WorkerAPI = Parameters<typeof WorkerDirector.processNextWork>[0];
const directors = [WorkerDirector];
let server: MongoMemoryServer;
let clients: MongoClient[] = [];
let apis: WorkerAPI[] = [];

const registerAdapter = (
  t: TestContext,
  type: string,
  options: Partial<IWorkerAdapter<any, any>> = {},
) => {
  const adapter = {
    ...WorkerAdapter,
    key: `shop.unchained.worker-plugin.${type}`,
    label: type,
    version: '1.0.0',
    type,
    doWork: async () => ({ success: true }),
    ...options,
  };
  for (const director of directors) {
    director.registerAdapter(adapter);
    t.after(() => director.unregisterAdapter(adapter.key));
  }
};

describe('WorkerDirector Mongo allocation', { timeout: 15000 }, () => {
  before(async () => {
    // Separate module instances also have separate in-process allocation state.
    directors.push(
      (await import(new URL('./WorkerDirector.ts?second-worker', import.meta.url).href)).WorkerDirector,
    );
    server = await MongoMemoryServer.create();
    clients = await Promise.all(
      [0, 1].map(() => MongoClient.connect(server.getUri(), { monitorCommands: true })),
    );
    apis = await Promise.all(
      clients.map(async (client) => {
        const db = client.db('worker-director-test');
        const locks = await OrderLocksCollection(db);
        return {
          modules: {
            worker: await configureWorkerModule({ db }),
            orders: {
              // Same namespace and lease as configureOrdersModule.acquireLock.
              acquireLock: (id: string, identifier: string, timeout = 5000) =>
                acquireLock(locks, `order:${identifier}:${id}`, timeout),
            },
          },
        } as unknown as WorkerAPI;
      }),
    );
  });

  beforeEach(async () => {
    const db = clients[0].db('worker-director-test');
    await Promise.all([
      db.collection('work_queue').deleteMany({}),
      db.collection('locco-locks').deleteMany({}),
    ]);
  });

  after(async () => {
    await Promise.all(clients.map((client) => client.close()));
    await server?.stop();
  });

  for (const limit of [1, 2]) {
    it(`enforces maxParallelAllocations = ${limit} across worker instances`, async (t) => {
      registerAdapter(t, 'TEST_LIMIT', { maxParallelAllocations: limit });
      for (let i = 0; i <= limit; i += 1) {
        await apis[0].modules.worker.addWork({ type: 'TEST_LIMIT' });
      }
      for (let i = 1; i < limit; i += 1) {
        assert.ok(await directors[0].allocateWork(apis[0]));
      }

      const resume = Promise.withResolvers<void>();
      const contentionOrStaleReads = Promise.withResolvers<void>();
      let reads = 0;
      const onCommand = (event: CommandSucceededEvent) => {
        if (
          event.commandName === 'update' &&
          event.reply.writeErrors?.some(({ code }) => code === 11000)
        ) {
          contentionOrStaleReads.resolve();
        }
      };
      for (const client of clients) client.on('commandSucceeded', onCommand);
      for (const api of apis) {
        const readCounts = api.modules.worker.allocationMap;
        t.mock.method(
          api.modules.worker,
          'allocationMap',
          async () => {
            const snapshot = await readCounts();
            reads += 1;
            if (reads === 2) contentionOrStaleReads.resolve();
            await resume.promise;
            return snapshot;
          },
          { times: 1 },
        );
      }

      const attempts = directors.map((director, index) =>
        director.allocateWork(apis[index], { types: ['TEST_LIMIT'], worker: `instance-${index}` }),
      );
      try {
        // Hold the first database snapshot until another instance either contends
        // on Mongo's unique lock index or reads the same stale count without a lock.
        await Promise.race([contentionOrStaleReads.promise, Promise.all(attempts)]);
      } finally {
        resume.resolve();
        for (const client of clients) client.off('commandSucceeded', onCommand);
      }
      const claimed = (await Promise.all(attempts)).filter(Boolean);
      assert.equal(claimed.length, 1);
      assert.match(claimed[0]!.worker!, /^instance-[01]$/);
      assert.equal((await apis[0].modules.worker.allocationMap()).TEST_LIMIT, limit);
    });
  }

  it('releases the Mongo lock before executing work so another type can run', async (t) => {
    const started = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    registerAdapter(t, 'TEST_IMPORT', {
      maxParallelAllocations: 1,
      doWork: async () => {
        started.resolve();
        await release.promise;
        return { success: true };
      },
    });
    registerAdapter(t, 'TEST_EMAIL');
    await apis[0].modules.worker.addWork({ type: 'TEST_IMPORT' });
    const importing = directors[0].processNextWork(apis[0]);

    try {
      await started.promise;
      assert.equal(
        await clients[0].db('worker-director-test').collection('locco-locks').countDocuments(),
        0,
      );
      await apis[1].modules.worker.addWork({ type: 'TEST_EMAIL' });
      const email = await directors[1].processNextWork(apis[1]);
      assert.equal(email?.type, 'TEST_EMAIL');
      assert.equal(email?.success, true);
      assert.equal((await apis[0].modules.worker.allocationMap()).TEST_IMPORT, 1);
    } finally {
      release.resolve();
      await importing;
    }
  });

  it('caps direct external allocations and excludes them from internal processing', async (t) => {
    registerAdapter(t, 'TEST_EXTERNAL', { external: true, maxParallelAllocations: 1 });
    await apis[0].modules.worker.addWork({ type: 'TEST_EXTERNAL' });
    await apis[0].modules.worker.addWork({ type: 'TEST_EXTERNAL' });
    assert.equal(await directors[0].processNextWork(apis[0]), null);
    assert.equal(await directors[0].allocateWork(apis[0], { types: [] }), null);
    const work = await directors[0].allocateWork(apis[0], {
      types: ['TEST_EXTERNAL'],
      worker: 'external',
    });
    assert.equal(work?.type, 'TEST_EXTERNAL');
    assert.equal(work?.worker, 'external');
    assert.equal(await directors[1].allocateWork(apis[1], { types: ['TEST_EXTERNAL'] }), null);
  });

  for (const method of ['allocationMap', 'allocateWork'] as const) {
    it(`releases the Mongo lock when ${method} fails`, async (t) => {
      registerAdapter(t, 'TEST_FAILURE');
      await apis[0].modules.worker.addWork({ type: 'TEST_FAILURE' });
      const error = new Error(`${method} failed`);
      t.mock.method(
        apis[0].modules.worker,
        method,
        async () => {
          throw error;
        },
        { times: 1 },
      );

      await assert.rejects(directors[0].allocateWork(apis[0]), error);
      assert.equal(
        await clients[0].db('worker-director-test').collection('locco-locks').countDocuments(),
        0,
      );
      assert.equal((await directors[1].allocateWork(apis[1]))?.type, 'TEST_FAILURE');
    });
  }
});
