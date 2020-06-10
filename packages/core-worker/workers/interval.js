import later from 'later';
import BaseWorker from './base';

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
    cronText = 'every 10 minutes',
  }) {
    super({ WorkerDirector, workerId });
    this.batchCount = batchCount;
    this.intervalDelay = later.parse.text(cronText);
  }

  start() {
    this.intervalHandle = setInterval(
      async () =>
        this.process({
          maxWorkItemCount: this.batchCount,
          referenceDate: new Date(
            Math.floor(new Date().getTime() / 1000) * 1000,
          ),
        }),
      this.intervalDelay,
    );
    setTimeout(() => {
      this.autorescheduleTypes();
    }, 300);
  }

  stop() {
    clearInterval(this.intervalHandle);
  }
}

export default IntervalWorker;
