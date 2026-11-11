import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { after, before, describe, it } from 'node:test';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getEmitAdapter, setEmitAdapter, subscribe } from '@unchainedshop/events';
import { configureWorkerModule, WorkerEventTypes, type Work } from './configureWorkerModule.ts';

describe('Worker events', { timeout: 15000 }, () => {
  let server: MongoMemoryServer | undefined;
  let client: MongoClient;
  let previousAdapter: ReturnType<typeof getEmitAdapter>;
  const payloads: { eventName: string; payload: any }[] = [];

  const configure = async (options?: { blacklistedVariables?: string[] }) => {
    const db = client.db('worker-events-test');
    await db.collection('work_queue').deleteMany({});
    payloads.length = 0;
    return configureWorkerModule({ db, options } as any);
  };

  before(async () => {
    // Use MONGO_URL (npm test shares the run's MongoDB), else start a server of its own
    server = process.env.MONGO_URL ? undefined : await MongoMemoryServer.create();
    client = await MongoClient.connect(process.env.MONGO_URL || server!.getUri());
    await configure();

    // A throwaway emitter keeps these subscriptions away from the events of later suites
    previousAdapter = getEmitAdapter();
    const emitter = new EventEmitter();
    setEmitAdapter({
      publish: (eventName, data) => emitter.emit(eventName, data),
      subscribe: (eventName, callback) => emitter.on(eventName, callback),
    });
    for (const eventName of Object.values(WorkerEventTypes)) {
      subscribe<Work>(eventName, ({ payload }) => {
        payloads.push({ eventName, payload: structuredClone(payload) });
      });
    }
  });

  after(async () => {
    setEmitAdapter(previousAdapter);
    await client.close();
    await server?.stop();
  });

  const eventsOf = (workId: string) =>
    payloads.filter(({ payload }) => (payload.work || payload)._id === workId);

  it('masks the default fields in event payloads and returns the stored work', async () => {
    const worker = await configure();
    const input = { token: 'plain-token', accessToken: 'plain-access', locale: 'de' };

    const added = await worker.addWork({ type: 'TEST_EVENTS', input });
    const allocated = await worker.allocateWork({ types: ['TEST_EVENTS'], worker: 'test' });
    const finished = await worker.finishWork(added._id, {
      success: true,
      result: { password: 'plain-password' },
      worker: 'test',
    });

    assert.deepEqual(added.input, input);
    assert.deepEqual(allocated?.input, input);
    assert.deepEqual(finished?.input, input);
    assert.deepEqual(finished?.result, { password: 'plain-password' });

    const events = eventsOf(added._id);
    assert.deepEqual(
      events.map(({ eventName }) => eventName),
      [WorkerEventTypes.ADDED, WorkerEventTypes.ALLOCATED, WorkerEventTypes.FINISHED],
    );
    for (const { payload } of events) {
      assert.deepEqual(payload.input, { token: '******', accessToken: '******', locale: 'de' });
      assert.ok(payload.created instanceof Date);
    }
    assert.deepEqual(events[2].payload.result, { password: '******' });
  });

  it('masks the configured fields only', async () => {
    const worker = await configure({ blacklistedVariables: ['LOCALE'] });

    const added = await worker.addWork({ type: 'TEST_EVENTS', input: { token: 'a', locale: 'de' } });

    assert.deepEqual(added.input, { token: 'a', locale: 'de' });
    assert.deepEqual(eventsOf(added._id)[0].payload.input, { token: 'a', locale: '******' });
  });

  it('masks nothing with an empty list', async () => {
    const worker = await configure({ blacklistedVariables: [] });

    const added = await worker.addWork({ type: 'TEST_EVENTS', input: { token: 'a' } });

    assert.deepEqual(eventsOf(added._id)[0].payload.input, { token: 'a' });
  });
});
