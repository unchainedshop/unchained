import { IWorker, Work } from '@unchainedshop/types/worker';
import later from '@breejs/later';
import { log } from '@unchainedshop/logger';
import os from 'os';
import { WorkerDirector } from '../director/WorkerDirector.js';

const { UNCHAINED_WORKER_ID } = process.env;

const resolveWorkerId = (customWorkerId: string, type: string) =>
  customWorkerId || UNCHAINED_WORKER_ID || `${os.hostname()}:${type}`;

interface WorkerParams {
  workerId: string;
  worker: IWorker<any>;
}

export const BaseWorker: IWorker<WorkerParams> = {
  key: 'shop.unchained.worker.base',
  label: 'Base worker. Do not use this directly.',
  version: '1.0.0',
  type: 'BASE',
  external: false,

  getFloorDate: (date = new Date()) => {
    const floored = new Date(Math.floor(date.getTime() / 1000) * 1000);
    return floored;
  },

  actions: ({ workerId, worker }: WorkerParams, unchainedAPI) => {
    const resolvedWorkerId = resolveWorkerId(workerId, worker.type);
    log(`${worker.key} -> Initialized: ${resolvedWorkerId}`);

    const workerActions = {
      start() {
        throw new Error(`Not implemented on ${this.constructor.key}`);
      },

      stop() {
        throw new Error(`Not implemented on ${this.constructor.key}`);
      },

      reset: async (referenceDate = new Date()) => {
        await unchainedAPI.modules.worker.markOldWorkAsFailed({
          types: WorkerDirector.getActivePluginTypes(false),
          worker: workerId,
          referenceDate,
        });
      },

      autorescheduleTypes: async ({ referenceDate }) => {
        return Promise.all(
          WorkerDirector.getAutoSchedules().map(async ([type, work]) => {
            const { schedule, input, priority, ...rest } = work;
            const fixedSchedule = { ...schedule };
            fixedSchedule.schedules[0].s = [0]; // ignore seconds, always run on second 0
            const nextDate = later.schedule(fixedSchedule).next(1, referenceDate);
            nextDate.setMilliseconds(0);
            return unchainedAPI.modules.worker.ensureOneWork({
              type,
              input: input(),
              scheduled: nextDate,
              worker: workerId,
              priority: priority || 0,
              ...rest,
              retries: 0,
            });
          }),
        );
      },

      process: async ({ maxWorkItemCount, referenceDate }) => {
        await workerActions.autorescheduleTypes({
          referenceDate,
        });

        const processRecursively = async (recursionCounter = 0) => {
          if (maxWorkItemCount && maxWorkItemCount < recursionCounter) return null;

          const work = await unchainedAPI.modules.worker.allocateWork({
            types: WorkerDirector.getActivePluginTypes(false),
            worker: workerId,
          });

          let doneWork: Work | null = null;

          if (work) {
            const output = await unchainedAPI.modules.worker.doWork(work, unchainedAPI);

            doneWork = await unchainedAPI.modules.worker.finishWork(work._id, {
              ...output,
              finished: work.finished || new Date(),
              started: work.started,
              worker: workerId,
            });
          }

          if (doneWork) return processRecursively(recursionCounter + 1);

          return null;
        };

        await processRecursively();
      },
    };

    workerActions.reset();

    return workerActions;
  },
};
