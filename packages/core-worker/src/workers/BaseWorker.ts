import later from '@breejs/later';
import { log } from '@unchainedshop/logger';
import { WorkerDirector } from '../director/WorkerDirector.js';
import { UnchainedCore } from '@unchainedshop/core';
import { Work } from '../types.js';

export type WorkData = Pick<
  Partial<Work>,
  'input' | 'originalWorkId' | 'priority' | 'retries' | 'timeout' | 'scheduled' | 'worker' | 'scheduleId'
> & { type: string };

export type IWorker<P extends { workerId?: string }> = {
  key: string;
  label: string;
  version: string;
  type: string;
  external: boolean;

  getFloorDate: (date?: Date) => Date;

  actions: (
    params: P,
    unchainedAPI: UnchainedCore,
  ) => {
    autorescheduleTypes: (options: { referenceDate: Date }) => Promise<Array<Work | null>>;
    process: (options: { maxWorkItemCount?: number; referenceDate?: Date }) => Promise<void>;
    reset: () => Promise<void>;
    start: () => void;
    stop: () => void;
  };
};

interface WorkerParams {
  workerId?: string;
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
    log(`${worker.key} -> Initialized ${worker.type}`);

    const workerActions = {
      start() {
        throw new Error(`Not implemented on ${this.constructor.key}`);
      },

      stop() {
        throw new Error(`Not implemented on ${this.constructor.key}`);
      },

      reset: async (referenceDate = new Date()) => {
        await unchainedAPI.modules.worker.markOldWorkAsFailed({
          types: WorkerDirector.getActivePluginTypes({ external: false }),
          worker: workerId,
          referenceDate,
        });
      },

      autorescheduleTypes: async ({ referenceDate }) => {
        return Promise.all(
          WorkerDirector.getAutoSchedules().map(async ([scheduleId, workConfig]) => {
            if (!workConfig.schedule) {
              await unchainedAPI.modules.worker.ensureNoWork({
                type: workConfig.type,
                priority: workConfig.priority || 0,
                scheduleId,
              });
              return null;
            }

            const fixedSchedule = { ...workConfig.schedule };
            fixedSchedule.schedules[0].s = [0]; // ignore seconds, always run on second 0
            const nextDate = later.schedule(fixedSchedule).next(1, referenceDate);
            nextDate.setMilliseconds(0);
            const workData: WorkData = {
              type: workConfig.type,
              scheduleId,
              scheduled: nextDate,
              timeout: workConfig.timeout,
              priority: workConfig.priority || 0,
              retries: workConfig.retries || 0,
            };
            if (workConfig.input) {
              workData.input = await workConfig.input(workData);
              // A work input fn can skip auto scheduling a new record
              // when it explicitly returns a falsish input instead of a dictionary
              if (!workData.input) return null;
            }
            return unchainedAPI.modules.worker.ensureOneWork(workData);
          }),
        );
      },

      process: async ({ maxWorkItemCount, referenceDate }) => {
        await workerActions.autorescheduleTypes({
          referenceDate,
        });

        const processRecursively = async (recursionCounter = 0) => {
          if (maxWorkItemCount && maxWorkItemCount < recursionCounter) return null;
          const doneWork = await unchainedAPI.modules.worker.processNextWork(unchainedAPI, workerId);
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
