import later from 'later';
import BaseWorker from './base';

const { NODE_ENV } = process.env;

const defaultSchedule = later.parse.text(
  NODE_ENV !== 'production' ? 'every 2 seconds' : 'every 30 seconds'
);

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

    const [one, two] = later.schedule(schedule).next(2);
    const diff = new Date(two).getTime() - new Date(one).getTime();
    this.intervalDelay = Math.min(1000, diff);
  }

  start() {
    this.intervalHandle = setInterval(() => {
      this.process({
        maxWorkItemCount: this.batchCount,
        referenceDate: new Date(Math.floor(new Date().getTime() / 1000) * 1000),
      });
    }, this.intervalDelay);
    setTimeout(() => {
      this.autorescheduleTypes();
    }, 300);
  }

  stop() {
    clearInterval(this.intervalHandle);
  }
}

export default IntervalWorker;
