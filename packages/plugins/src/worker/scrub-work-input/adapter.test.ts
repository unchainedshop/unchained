import { afterEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { WorkerDirector } from '@unchainedshop/core';
import { ScrubWorkInputWorker } from './adapter.ts';
import { createScrubWorkInputPlugin } from './index.ts';

const DAY = 24 * 60 * 60 * 1000;

const createUnchainedAPI = (scrubbedCount = 2) => {
  const scrubWorkInput = mock.fn(async () => scrubbedCount);
  return { unchainedAPI: { modules: { worker: { scrubWorkInput } } } as any, scrubWorkInput };
};

describe('ScrubWorkInputWorker', () => {
  afterEach(() => {
    WorkerDirector.disableAutoscheduling(ScrubWorkInputWorker.type);
  });

  it('scrubs mails and messages finished more than a day ago by default', async () => {
    const { unchainedAPI, scrubWorkInput } = createUnchainedAPI();

    const result = await ScrubWorkInputWorker.doWork({}, unchainedAPI, 'work-id');

    assert.deepEqual(result, { success: true, result: { scrubbedCount: 2 } });
    const [{ types, keep, before }] = scrubWorkInput.mock.calls[0].arguments as any;
    assert.deepEqual(types, ['EMAIL', 'MESSAGE']);
    assert.deepEqual(keep, ['template']);
    assert.ok(Math.abs(Date.now() - DAY - before.getTime()) < 1000);
  });

  it('takes the types, the kept keys and the age from the input', async () => {
    const { unchainedAPI, scrubWorkInput } = createUnchainedAPI();

    await ScrubWorkInputWorker.doWork(
      { types: ['TWILIO'], keep: [], maxAgeInSeconds: 3600 },
      unchainedAPI,
      'work-id',
    );

    const [{ types, keep, before }] = scrubWorkInput.mock.calls[0].arguments as any;
    assert.deepEqual(types, ['TWILIO']);
    assert.deepEqual(keep, []);
    assert.ok(Math.abs(Date.now() - 3600 * 1000 - before.getTime()) < 1000);
  });

  it('refuses an invalid input', async () => {
    const { unchainedAPI, scrubWorkInput } = createUnchainedAPI();

    const result = await ScrubWorkInputWorker.doWork(
      { maxAgeInSeconds: '1 day' as any },
      unchainedAPI,
      'work-id',
    );

    assert.equal(result.success, false);
    assert.equal(result.error.name, 'INVALID_INPUT');
    assert.equal(scrubWorkInput.mock.callCount(), 0);
  });

  const autoSchedule = () =>
    WorkerDirector.getAutoSchedules().find(
      ([scheduleId]) => scheduleId === ScrubWorkInputWorker.type,
    )?.[1];

  it('runs every hour once the plugin is registered', async () => {
    await createScrubWorkInputPlugin().onRegister?.({} as any);

    const config = autoSchedule();
    assert.equal(config?.retries, 0);
    assert.deepEqual(config?.schedule?.schedules[0].m, [0]);
    assert.equal(config?.schedule?.schedules[0].h, undefined);
    assert.deepEqual(await config?.input?.({} as any), {});
  });

  it('runs with the options of the plugin', async () => {
    const plugin = createScrubWorkInputPlugin({ maxAgeInSeconds: 600, schedule: '30 3 * * *' });

    await plugin.onRegister?.({} as any);

    const config = autoSchedule();
    assert.deepEqual(config?.schedule?.schedules[0].m, [30]);
    assert.deepEqual(config?.schedule?.schedules[0].h, [3]);
    assert.deepEqual(await config?.input?.({} as any), { maxAgeInSeconds: 600 });
  });
});
