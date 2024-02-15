import { IWorker, WorkData } from '@unchainedshop/types/worker.js';
import later from '@breejs/later';
import { log } from '@unchainedshop/logger';
import { WorkerDirector } from '../director/WorkerDirector.js';

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
            const fixedSchedule = { ...workConfig.schedule };
            fixedSchedule.schedules[0].s = [0]; // ignore seconds, always run on second 0
            const nextDate = later.schedule(fixedSchedule).next(1, referenceDate);
            nextDate.setMilliseconds(0);
            const workData: WorkData = {
              type: workConfig.type,
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
            const workId = `${scheduleId}:${workData.scheduled.getTime()}`;
            return unchainedAPI.modules.worker.ensureOneWork(workData, workId);
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
