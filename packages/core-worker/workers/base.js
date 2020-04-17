import os from 'os';

import { log } from 'meteor/unchained:core-logger';

import External from '../plugins/external';

const { WORKER_ID } = process.env;

class BaseWorker {
  static key = 'shop.unchained.worker.base';

  static label = 'Base worker. Do not use this directly.';

  static version = '1.0';

  static type = 'BASE';

  constructor({
    WorkerDirector,
    workerId = WORKER_ID || `${os.hostname()}:${this.type}`,
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

  async findOneAndProcessWork() {
    return this.WorkerDirector.findOneAndProcessWork({
      types: this.getInternalTypes(),
      worker: this.workerId,
    });
  }
}

export default BaseWorker;
