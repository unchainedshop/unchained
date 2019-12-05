/* eslint-disable class-methods-use-this */
import { SyncedCron } from 'meteor/littledata:synced-cron';
import { log } from 'meteor/unchained:core-logger';

import BaseWorker from './base';

const { WORKER_CRON_TEXT = 'every 10 minutes' } = process.env;

SyncedCron.config({
  log: true,

  logger({ level, message, tag }) {
    log(message, { level, tag });
  },

  collectionName: 'cron_history',

  utc: true
});

class CronWorker extends BaseWorker {
  static key = 'shop.unchained.worker.cron';

  static label =
    'Allocates work on fixed intervals with littledata:synced-cron.';

  static version = '1.0';

  static type = 'CRON';

  constructor({ WorkerDirector, workerId, cronText = WORKER_CRON_TEXT }) {
    super({ WorkerDirector, workerId });

    SyncedCron.add({
      name: `Allocates work on fixed intervals: ${cronText}`,
      schedule(parser) {
        return parser.text(cronText);
      },
      job: () => {
        return this.allocateAndWork();
      }
    });
  }

  async allocateAndWork() {
    const work = await this.WorkerDirector.allocateWork({
      types: this.getInternalTypes(),
      workerId: this.workerId
    });

    if (work) {
      const output = await this.WorkerDirector.doWork(work);

      return this.WorkerDirector.finishWork({
        workId: work._id,
        worker: this.workerId,
        ...output
      });
    }

    return false;
  }

  start() {
    SyncedCron.start();
  }

  stop() {
    SyncedCron.pause();
  }
}

export default CronWorker;
