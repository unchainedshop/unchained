import { setupDatabase, disconnect } from './helpers.js';
import { getTestPlatform } from './setup.js';
import { WorkerDirector } from '@unchainedshop/core';
import assert from 'node:assert';
import test from 'node:test';

let db;
let modules;

const SCHEDULE_ID = 'shop.unchained.worker-plugin.autoschedule-input-regression';
const TYPE = 'HEARTBEAT';

const ensure = (input) =>
  modules.worker.ensureOneWork({
    type: TYPE,
    scheduleId: SCHEDULE_ID,
    scheduled: new Date('2030-01-01T00:30:00.000Z'),
    retries: 0,
    input,
  });

test.describe('Work Queue: autoscheduled input', () => {
  test.before(async () => {
    [db] = await setupDatabase();
    ({ modules } = getTestPlatform().unchainedAPI);
  });

  test.after(async () => {
    await db.collection('work_queue').deleteMany({ scheduleId: SCHEDULE_ID });
    await disconnect();
  });

  test('stores an empty object when the schedule carries no input', async () => {
    // An undefined `$set` value is serialized as null rather than skipped, which used to leave
    // `input: null` on every autoscheduled work item.
    const work = await ensure(undefined);

    assert.notStrictEqual(work.input, null);
    assert.deepStrictEqual(work.input, {});

    const stored = await db.collection('work_queue').findOne({ _id: work._id });
    assert.deepStrictEqual(stored.input, {});
  });

  test('keeps an input the schedule does provide', async () => {
    const work = await ensure({ maxAgeDays: 7 });
    assert.deepStrictEqual(work.input, { maxAgeDays: 7 });
  });

  test('hands an adapter an object even when the stored input is null', async () => {
    // Work queued by an older version still holds a null input, and a `= {}` default parameter
    // only guards undefined - which is what made every GC_GUESTS run fail.
    const probeKey = 'shop.unchained.worker-plugin.autoschedule-input-probe';
    let destructured = false;
    WorkerDirector.registerAdapter({
      key: probeKey,
      label: 'Autoschedule input probe',
      version: '1.0.0',
      type: 'AUTOSCHEDULE_INPUT_PROBE',
      doWork: async ({ anything } = {}) => {
        destructured = true;
        return { success: true, result: { anything: anything ?? null } };
      },
    });

    try {
      const output = await WorkerDirector.doWork(
        { type: 'AUTOSCHEDULE_INPUT_PROBE', input: null, _id: 'probe-work' },
        getTestPlatform().unchainedAPI,
      );
      assert.strictEqual(destructured, true);
      assert.strictEqual(output.success, true);
    } finally {
      WorkerDirector.unregisterAdapter(probeKey);
    }
  });
});
