import { Context } from '@unchainedshop/types/api';
import { Modules } from '@unchainedshop/types/modules';
import later from 'later';
import { BaseWorker } from './BaseWorker';

const { NODE_ENV } = process.env;

const defaultSchedule = later.parse.text(
  NODE_ENV !== 'production' ? 'every 2 seconds' : 'every 30 seconds'
);

export const scheduleToInterval = (scheduleRaw: Date | string) => {
  const referenceDate = new Date(1000);
  const schedule =
    typeof scheduleRaw === 'string'
      ? later.parse.text(scheduleRaw)
      : scheduleRaw;
  const [one, two] = later.schedule(schedule).next(2, referenceDate);
  const diff = new Date(two).getTime() - new Date(one).getTime();
  return Math.min(1000 * 60 * 60, diff); // at least once every hour!
};

export class IntervalWorker extends BaseWorker {
  static key = 'shop.unchained.worker.cron';

  static label =
    'Allocates work on fixed intervals with native node setInterval';

  static version = '1.0';

  static type = 'CRON';

  private batchCount: number;
  private intervalDelay: number;
  private intervalHandle: NodeJS.Timer;

  constructor(
    {
      modules,
      workerId,
      batchCount = 0,
      schedule = defaultSchedule,
    }: {
      modules: Modules;
      workerId: string;
      batchCount?: number;
      schedule?: Date | string;
    },
    requestContext: Context
  ) {
    super({ workerId }, requestContext);
    this.batchCount = batchCount;
    this.intervalDelay = scheduleToInterval(schedule);
  }

  start() {
    this.intervalHandle = setInterval(() => {
      this.process({
        maxWorkItemCount: this.batchCount,
        /* @ts-ignore */
        referenceDate: this.constructor.floorDate(),
      });
    }, this.intervalDelay);
  }

  stop() {
    clearInterval(this.intervalHandle);
  }
}
