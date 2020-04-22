import { log } from 'meteor/unchained:core-logger';
import later from 'later';
import BaseWorker from './base';

class IntervalWorker extends BaseWorker {
  static key = 'shop.unchained.worker.cron';

  static label =
    'Allocates work on fixed intervals with native node setInterval';

  static version = '1.0';

  static type = 'CRON';

  async tick() {
    const processRecursively = async (recursionCounter = 0) => {
      if (this.batchCount && this.batchCount < recursionCounter) return null;
      const doneWork = await this.findOneAndProcessWork();
      if (doneWork) {
        log(doneWork, { level: 'debug' });
        return processRecursively(recursionCounter + 1);
      }
      return null;
    };
    return processRecursively();
  }

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
    this.intervalHandle = setInterval(this.tick.bind(this), this.intervalDelay);
  }

  stop() {
    clearInterval(this.intervalHandle);
  }
}

export default IntervalWorker;
