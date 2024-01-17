import { IScheduler, Work, WorkData } from '@unchainedshop/types/worker.js';
import { log } from '@unchainedshop/logger';
import { subscribe } from '@unchainedshop/events';
import { WorkerEventTypes } from '../director/WorkerEventTypes.js';

export interface FailedReschedulerParams {
  retryInput?: (
    workData: WorkData,
    priorInput: Record<string, any>,
  ) => Promise<Record<string, any> | null>;
}

export const FailedRescheduler: IScheduler<FailedReschedulerParams> = {
  key: 'shop.unchained.scheduler.failed',
  label: 'Reschedule failed works',
  version: '1.0.0',

  actions: ({ retryInput }, unchainedAPI) => {
    const handleFinishedWork = async ({ payload: work }: { payload: Work }) => {
      if (!work.success && work.retries > 0) {
        const now = new Date();
        const workDelayMs = work.scheduled.getTime() - work.created.getTime();

        // In short: Double the delay of the old work or delay for 5 seconds
        const scheduled =
          workDelayMs > 1000
            ? new Date(now.getTime() + workDelayMs * 2)
            : new Date(now.setSeconds(now.getSeconds() + 5));

        log(
          `${FailedRescheduler.key} -> Reschedule failed work ${work._id} ${
            work.type
          } for ${scheduled.toISOString()} (in ${Math.round(workDelayMs / 1000)}). Remaining retries: ${
            work.retries
          }`,
        );

        const workData: WorkData = {
          type: work.type,
          priority: work.priority,
          originalWorkId: work.originalWorkId || work._id,
          retries: work.retries - 1,
          timeout: work.timeout,
          scheduled,
        };

        if (retryInput) {
          workData.input = await retryInput(workData, work.input);
        } else {
          workData.input = work.input;
        }

        unchainedAPI.modules.worker.addWork(workData);
      }
    };

    return {
      start() {
        subscribe<Work>(WorkerEventTypes.FINISHED, handleFinishedWork);
      },

      stop() {
        /* */
      },
    };
  },
};
