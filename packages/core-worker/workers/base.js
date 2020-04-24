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
    workerId = UNCHAINED_WORKER_ID ||
      `${os.hostname()}:${this.constructor.type}`,
  }) {
    log(`${this.constructor.key} -> Initialized: ${workerId}`);
    this.WorkerDirector = WorkerDirector;
    this.workerId = workerId;
    this.reset();
  }

  getInternalTypes() {
    return this.WorkerDirector.getActivePluginTypes().filter(
      (type) => type !== External.type
    );
  }

  start() {
    throw new Error(`Not implemented on ${this.constructor.key}`);
  }

  stop() {
    throw new Error(`Not implemented on ${this.constructor.key}`);
  }

  async reset(referenceDate = new Date()) {
    return this.WorkerDirector.markOldWorkFailed({
      types: this.getInternalTypes(),
      worker: this.workerId,
      referenceDate,
    });
  }

  async autorescheduleTypes(referenceDate = new Date()) {
    const normalizedReferenceDate = new Date(
      Math.floor(referenceDate.getTime() / 1000) * 1000
    );
    return Promise.all(
      Object.entries(this.WorkerDirector.autoSchedule).map(
        async ([type, configuration]) => {
          const { cronText, input, ...rest } = configuration;
          const schedule = later.parse.text(cronText);
          const nextDate = later
            .schedule(schedule)
            .next(1, normalizedReferenceDate);
          await this.WorkerDirector.ensureOneWork({
            type,
            input: input(),
            scheduled: nextDate,
            worker: this.workerId,
            ...rest,
          });
        }
      )
    );
  }

  async process({ maxWorkItemCount, referenceDate } = {}) {
    await this.autorescheduleTypes(referenceDate);
    const processRecursively = async (recursionCounter = 0) => {
      if (maxWorkItemCount && maxWorkItemCount < recursionCounter) return null;
      const doneWork = await this.WorkerDirector.findOneAndProcessWork({
        types: this.getInternalTypes(),
        worker: this.workerId,
      });
      if (doneWork) return processRecursively(recursionCounter + 1);
      return null;
    };
    await processRecursively();
  }
}

export default BaseWorker;
