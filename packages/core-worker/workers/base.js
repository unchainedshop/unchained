import os from 'os';
import later from 'later';

import { log } from 'meteor/unchained:core-logger';

import External from '../plugins/external';

const { UNCHAINED_WORKER_ID } = process.env;

class BaseWorker {
  static key = 'shop.unchained.worker.base';

  static label = 'Base worker. Do not use this directly.';

  static version = '1.0';

  static type = 'BASE';

  constructor({
    WorkerDirector,
    workerId = UNCHAINED_WORKER_ID || `${os.hostname()}:${this.type}`,
  }) {
    log(`${this.constructor.key} -> Initialized: ${workerId}`);
    this.WorkerDirector = WorkerDirector;
    this.workerId = workerId;
  }

  getInternalTypes() {
    return this.WorkerDirector.getActivePluginTypes().filter(
      (type) => type !== External.type
    );
  }

  start() {
    throw new Error(`Not implemented on ${this.key}`);
  }

  stop() {
    throw new Error(`Not implemented on ${this.key}`);
  }

  async autorescheduleTypes() {
    return Promise.all(
      Object.entries(this.WorkerDirector.autoSchedule).map(
        async ([type, configuration]) => {
          const { cronText, input, ...rest } = configuration;
          const schedule = later.parse.text(cronText);
          const referenceDate = new Date();
          const prevDate = later.schedule(schedule).prev(1, referenceDate);
          const nextDate = later.schedule(schedule).next(1, referenceDate);
          const work = await this.WorkerDirector.work({
            type,
            scheduled: { $gte: prevDate },
            status: ['NEW', 'ALLOCATED', 'DELETED'],
          });
          if (!work) {
            await this.WorkerDirector.addWork({
              type,
              input: input(),
              scheduled: nextDate,
              ...rest,
            });
          }
        }
      )
    );
  }

  async findOneAndProcessWork() {
    return this.WorkerDirector.findOneAndProcessWork({
      types: this.getInternalTypes(),
      worker: this.workerId,
    });
  }
}

export default BaseWorker;
