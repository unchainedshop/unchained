import { IScheduler, Work } from '@unchainedshop/types/worker';
import { log } from '@unchainedshop/logger';
import { WorkerDirector } from '../director/WorkerDirector';
import { WorkerEventTypes } from '../director/WorkerEventTypes';

export const FailedRescheduler: IScheduler = {
  key: 'shop.unchained.scheduler.failed',
  label: 'Reschedule failed works',
  version: '1.0.0',

  actions: (requestContext) => {
    const handleFinishedWork = ({ work }: { work: Work }) => {
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

        requestContext.modules.worker.addWork({
          type: work.type,
          input: work.input,
          priority: work.priority,
          originalWorkId: work.originalWorkId || work._id,
          retries: work.retries - 1,
          scheduled,
        });
      }
    };

    return {
      start() {
        WorkerDirector.events.on(WorkerEventTypes.FINISHED, handleFinishedWork);
      },

      stop() {
        WorkerDirector.events.off(WorkerEventTypes.FINISHED, handleFinishedWork);
      },
    };
  },
};
