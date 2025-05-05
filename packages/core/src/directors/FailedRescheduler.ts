import { defaultLogger } from '@unchainedshop/logger';
import { subscribe } from '@unchainedshop/events';
import { Work, WorkData, WorkerEventTypes } from '@unchainedshop/core-worker';

export interface FailedReschedulerParams {
  transformRetry?: (workData: WorkData) => Promise<WorkData | null>;
}

export interface IScheduler<P> {
  key: string;
  label: string;
  version: string;

  actions: (
    params: P,
    unchainedAPI,
  ) => {
    start: () => void;
    stop: () => void;
  };
}

export const FailedRescheduler: IScheduler<FailedReschedulerParams> = {
  key: 'shop.unchained.scheduler.failed',
  label: 'Reschedule failed works',
  version: '1.0.0',

  actions: ({ transformRetry }, unchainedAPI) => {
    const handleFinishedWork = async ({ payload: work }: { payload: Work }) => {
      if (!work.success && work.retries > 0) {
        const now = new Date();
        const workDelayMs = work.scheduled.getTime() - work.created.getTime();

        // In short: Double the delay of the old work or delay for 5 seconds
        const scheduled =
          workDelayMs > 1000
            ? new Date(now.getTime() + workDelayMs * 2)
            : new Date(now.setSeconds(now.getSeconds() + 5));

        defaultLogger.error(
          `${FailedRescheduler.key} -> Reschedule failed work ${work._id} ${
            work.type
          } for ${scheduled.toISOString()} (in ${Math.round(workDelayMs / 1000)}). Remaining retries: ${
            work.retries
          }`,
        );

        const newWorkData = {
          type: work.type,
          priority: work.priority,
          originalWorkId: work.originalWorkId || work._id,
          retries: work.retries - 1,
          timeout: work.timeout,
          input: work.input,
          scheduled,
        };
        await unchainedAPI.modules.worker.addWork(
          transformRetry ? await transformRetry(newWorkData) : newWorkData,
        );
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
