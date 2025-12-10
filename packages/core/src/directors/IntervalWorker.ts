import later, { type ScheduleData } from '@breejs/later';
import { BaseWorker, type IWorker } from './BaseWorker.ts';
import { createLogger } from '@unchainedshop/logger';

const { NODE_ENV } = process.env;

const logger = createLogger('unchained:worker:interval');

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
  const nextDates = later.schedule(schedule).next(2, referenceDate) as Date[];

  if (!nextDates || nextDates.length < 2) {
    throw new Error('Schedule must produce at least 2 consecutive dates');
  }

  const [one, two] = nextDates;
  const diff = new Date(two).getTime() - new Date(one).getTime();
  return Math.min(1000 * 60 * 60, diff); // at least once every hour!
};

export const IntervalWorker: IWorker<IntervalWorkerParams> = {
  ...BaseWorker,

  key: 'shop.unchained.worker.cron',
  label: 'Allocates work on fixed intervals with native node setInterval',
  version: '1.0.0',
  type: 'CRON',

  actions: ({ workerId, batchCount = 10, schedule = defaultSchedule }, unchainedAPI) => {
    const baseWorkerActions = BaseWorker.actions({ workerId, worker: IntervalWorker }, unchainedAPI);

    const intervalDelay = scheduleToInterval(schedule);
    let intervalHandle: NodeJS.Timeout | null = null;

    return {
      ...baseWorkerActions,

      start() {
        // Prevent multiple intervals from running
        if (intervalHandle) {
          return;
        }

        intervalHandle = setInterval(async () => {
          try {
            await baseWorkerActions.process({
              maxWorkItemCount: batchCount,
              referenceDate: IntervalWorker.getFloorDate(),
            });
          } catch (error) {
            logger.error(error);
          }
        }, intervalDelay);
      },

      stop() {
        if (intervalHandle) {
          clearInterval(intervalHandle);
          intervalHandle = null;
        }
      },
    };
  },
};
