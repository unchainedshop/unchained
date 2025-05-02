import later, { ScheduleData } from '@breejs/later';
import { BaseWorker, IWorker } from './BaseWorker.js';

const { NODE_ENV } = process.env;

export interface IntervalWorkerParams {
  workerId?: string;
  batchCount?: number;
  schedule?: ScheduleData;
}

const defaultSchedule = later.parse.text(
  NODE_ENV !== 'production' ? 'every 2 seconds' : 'every 30 seconds',
);

export const scheduleToInterval = (schedule: ScheduleData) => {
  const referenceDate = new Date(1000);
  const [one, two] = later.schedule(schedule).next(2, referenceDate) as Date[];
  const diff = new Date(two).getTime() - new Date(one).getTime();
  return Math.min(1000 * 60 * 60, diff); // at least once every hour!
};

export const IntervalWorker: IWorker<IntervalWorkerParams> = {
  ...BaseWorker,

  key: 'shop.unchained.worker.cron',
  label: 'Allocates work on fixed intervals with native node setInterval',
  version: '1.0.0',
  type: 'CRON',

  actions: ({ workerId, batchCount = 0, schedule = defaultSchedule }, unchainedAPI) => {
    const baseWorkerActions = BaseWorker.actions({ workerId, worker: IntervalWorker }, unchainedAPI);

    const intervalDelay = scheduleToInterval(schedule);
    let intervalHandle: NodeJS.Timeout;

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
