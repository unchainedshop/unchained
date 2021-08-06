import later from 'later';
import { Meteor } from 'meteor/meteor';
import BaseWorker from './base';

const { NODE_ENV } = process.env;

const defaultSchedule = later.parse.text(
  NODE_ENV !== 'production' ? 'every 2 seconds' : 'every 30 seconds'
);

export const scheduleToInterval = (scheduleRaw) => {
  const referenceDate = new Date(1000);
  const schedule =
    typeof scheduleRaw === 'string'
      ? later.parse.text(scheduleRaw)
      : scheduleRaw;
  const [one, two] = later.schedule(schedule).next(2, referenceDate);
  const diff = new Date(two).getTime() - new Date(one).getTime();
  return Math.min(1000 * 60 * 60, diff); // at least once every hour!
};

class IntervalWorker extends BaseWorker {
  static key = 'shop.unchained.worker.cron';

  static label =
    'Allocates work on fixed intervals with native node setInterval';

  static version = '1.0';

  static type = 'CRON';

  constructor({
    WorkerDirector,
    workerId,
    batchCount = 0,
    schedule = defaultSchedule,
  }) {
    super({ WorkerDirector, workerId });
    this.batchCount = batchCount;
    this.intervalDelay = scheduleToInterval(schedule);
  }

  start() {
    this.intervalHandle = Meteor.setInterval(() => {
      this.process({
        maxWorkItemCount: this.batchCount,
        referenceDate: new Date(Math.floor(new Date().getTime() / 1000) * 1000),
      });
    }, this.intervalDelay);
  }

  stop() {
    Meteor.clearInterval(this.intervalHandle);
  }
}

export default IntervalWorker;
