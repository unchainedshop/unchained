import os from 'os';
import later from 'later';

import { log } from 'meteor/unchained:core-logger';

import External from '../plugins/external';

const { UNCHAINED_WORKER_ID } = process.env;

const resolveWorkerId = (customWorkerId, type) =>
  customWorkerId || UNCHAINED_WORKER_ID || `${os.hostname()}:${type}`;

class BaseWorker {
  static key = 'shop.unchained.worker.base';

  static label = 'Base worker. Do not use this directly.';

  static version = '1.0';

  static type = 'BASE';

  constructor({ WorkerDirector, workerId }) {
    this.WorkerDirector = WorkerDirector;
    this.workerId = resolveWorkerId(workerId, this.constructor.type);
    log(`${this.constructor.key} -> Initialized: ${this.workerId}`);
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
    await this.WorkerDirector.markOldWorkFailed({
      types: this.getInternalTypes(),
      worker: this.workerId,
      referenceDate,
    });
  }

  async autorescheduleTypes(referenceDate = new Date()) {
    return Promise.all(
      Object.entries(this.WorkerDirector.autoSchedule).map(
        async ([type, configuration]) => {
          const { schedule, input, ...rest } = configuration;
          const fixedSchedule = { ...schedule };
          fixedSchedule.schedules[0].s = [0]; // ignore seconds
          const nextDate = later.schedule(fixedSchedule).next(1, referenceDate);
          nextDate.setMilliseconds(0);
          await this.WorkerDirector.ensureOneWork({
            type,
            input: input(),
            scheduled: nextDate,
            worker: this.workerId,
            ...rest,
            retries: 0,
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
