import { Context } from '@unchainedshop/types/api';
import { IWorker, WorkerSchedule } from '@unchainedshop/types/worker';
import later from 'later';
import { BaseWorker } from './BaseWorker';

const { NODE_ENV } = process.env;

interface WorkerParams {
  workerId: string;
  batchCount?: number;
  schedule: WorkerSchedule | string;
}

const defaultSchedule = later.parse.text(
  NODE_ENV !== 'production' ? 'every 2 seconds' : 'every 30 seconds',
) as WorkerSchedule;

export const scheduleToInterval = (scheduleRaw: WorkerSchedule | string) => {
  const referenceDate = new Date(1000);
  const schedule = typeof scheduleRaw === 'string' ? later.parse.text(scheduleRaw) : scheduleRaw;
  const [one, two] = later.schedule(schedule).next(2, referenceDate);
  const diff = new Date(two).getTime() - new Date(one).getTime();
  return Math.min(1000 * 60 * 60, diff); // at least once every hour!
};

export const IntervalWorker: IWorker<WorkerParams> = {
  ...BaseWorker,

  key: 'shop.unchained.worker.cron',
  label: 'Allocates work on fixed intervals with native node setInterval',
  version: '1.0',
  type: 'CRON',

  actions: ({ workerId, batchCount = 0, schedule = defaultSchedule }, requestContext: Context) => {
    const baseWorkerActions = BaseWorker.actions({ workerId, worker: IntervalWorker }, requestContext);

    const intervalDelay = scheduleToInterval(schedule);
    let intervalHandle: NodeJS.Timer;

    return {
      ...baseWorkerActions,

      start() {
        intervalHandle = setInterval(() => {
          baseWorkerActions.process({
            maxWorkItemCount: batchCount,
            referenceDate: IntervalWorker.getFloorDate(),
          });
        }, intervalDelay);
      },

      stop() {
        clearInterval(intervalHandle);
      },
    };
  },
};
