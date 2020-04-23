import { SyncedCron } from 'meteor/littledata:synced-cron';
import { log } from 'meteor/unchained:core-logger';

import BaseWorker from './base';

SyncedCron.config({
  log: true,

  logger({ message, tag }) {
    log(message, { level: 'debug', tag });
  },

  collectionName: 'cron_history',

  utc: true,
});

class CronWorker extends BaseWorker {
  static key = 'shop.unchained.worker.cron';

  static label =
    'Allocates work on fixed intervals with littledata:synced-cron.';

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

    SyncedCron.add({
      name: `Allocates work on fixed intervals: ${cronText}`,
      schedule(parser) {
        return parser.text(cronText);
      },
      job: async () => this.process({ maxWorkItemCount: this.batchCount }),
    });
  }

  // eslint-disable-next-line
  start() {
    SyncedCron.start();
    setTimeout(() => {
      this.autorescheduleTypes();
    }, 300);
  }

  // eslint-disable-next-line
  stop() {
    SyncedCron.pause();
  }
}

export default CronWorker;
