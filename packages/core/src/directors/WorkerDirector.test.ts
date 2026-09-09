import assert from 'node:assert';
import { describe, it, before, after } from 'node:test';
import { WorkerDirector } from './WorkerDirector.ts';
import { WorkerAdapter } from './WorkerAdapter.ts';

const tick = () => new Promise((resolve) => setImmediate(resolve));

describe('WorkerDirector allocation', () => {
  const TestAdapter = {
    ...WorkerAdapter,
    key: 'shop.unchained.worker-plugin.test-serial',
    label: 'Test Serial',
    version: '1.0.0',
    type: 'TEST_SERIAL',
    maxParallelAllocations: 1,
    async doWork() {
      // Yield so the work stays "in flight" across the event loop while a second
      // caller tries to allocate — this is what exposes a non-atomic allocation.
      await tick();
      return { success: true };
    },
  };

  before(() => {
    WorkerDirector.registerAdapter(TestAdapter as any);
  });

  after(() => {
    WorkerDirector.unregisterAdapter(TestAdapter.key);
  });

  it('respects maxParallelAllocations under concurrent processNextWork callers', async () => {
    // Two work items of the same single-allocation type are pending. Reading the
    // in-flight count and claiming a work item must be one atomic step, or two
    // concurrent callers both read count=0 and both allocate — exceeding the cap.
    let inFlight = 0;
    let maxInFlight = 0;
    const pending = ['work-1', 'work-2'];

    const worker = {
      workerId: 'test-worker',
      allocationMap: async () => {
        await tick();
        return { TEST_SERIAL: inFlight } as Record<string, number>;
      },
      allocateWork: async ({ types }: { types: string[] }) => {
        await tick();
        if (!types.includes('TEST_SERIAL')) return null;
        const _id = pending.shift();
        if (!_id) return null;
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        return { _id, type: 'TEST_SERIAL', started: new Date() };
      },
      finishWork: async (_id: string) => {
        inFlight -= 1;
        return { _id };
      },
    };

    const unchainedAPI = { modules: { worker } } as any;

    await Promise.all([
      WorkerDirector.processNextWork(unchainedAPI),
      WorkerDirector.processNextWork(unchainedAPI),
    ]);

    assert.strictEqual(maxInFlight, 1);
  });
});
