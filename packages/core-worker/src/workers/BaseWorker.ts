import later from '@breejs/later';
import { log } from '@unchainedshop/logger';
import { WorkerDirector } from '../director/WorkerDirector.js';
import { IWorker, Work, WorkData } from '../types/index.js';

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
        throw new Error(`Not implemented on ${(this.constructor as any).key}`);
      },

      stop() {
        throw new Error(`Not implemented on ${(this.constructor as any).key}`);
      },

      reset: async (referenceDate = new Date()) => {
        await unchainedAPI.modules.worker.markOldWorkAsFailed({
          types: WorkerDirector.getActivePluginTypes({ external: false }),
          worker: workerId as string,
          referenceDate,
        });
      },

      autorescheduleTypes: async ({ referenceDate }: { referenceDate: Date }) => {
        return Promise.all(
          WorkerDirector.getAutoSchedules().map(async ([type, workConfig]) => {
            const fixedSchedule = { ...workConfig.schedule };
            fixedSchedule.schedules[0].s = [0]; // ignore seconds, always run on second 0
            const nextDate = later.schedule(fixedSchedule).next(1, referenceDate);
            nextDate.setMilliseconds(0);
            const workData: WorkData = {
              type,
              scheduled: nextDate,
              timeout: workConfig.timeout,
              priority: workConfig.priority || 0,
              retries: workConfig.retries || 0,
              input: undefined,
            };
            if (workConfig.input) {
              workData.input = (await workConfig.input(workData)) as Record<string, any> | undefined;
              // A work input fn can skip auto scheduling a new record
              // when it explicitly returns a falsish input instead of a dictionary
              if (!workData.input) return null;
            }
            return unchainedAPI.modules.worker.ensureOneWork(workData);
          }),
        );
      },

      process: async ({
        maxWorkItemCount,
        referenceDate,
      }: {
        maxWorkItemCount?: number | undefined;
        referenceDate?: Date | undefined;
      }): Promise<void> => {
        await workerActions.autorescheduleTypes({
          referenceDate: referenceDate as Date,
        });

        const processRecursively = async (recursionCounter: number = 0): Promise<Work | null> => {
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
