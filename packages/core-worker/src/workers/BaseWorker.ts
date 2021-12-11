import os from 'os';
import later from 'later';
import { log } from 'meteor/unchained:logger';
import { dbIdToString } from 'meteor/unchained:utils';
import { Modules } from '@unchainedshop/types/modules';

import External from '../../plugins/external';
import { WorkerDirector } from '../director/WorkerDirector';
import { Module } from 'module';
import { Work } from '@unchainedshop/types/worker';

const { UNCHAINED_WORKER_ID } = process.env;

const resolveWorkerId = (customWorkerId, type) =>
  customWorkerId || UNCHAINED_WORKER_ID || `${os.hostname()}:${type}`;

class BaseWorker {
  static key = 'shop.unchained.worker.base';

  static label = 'Base worker. Do not use this directly.';

  static version = '1.0';

  static type = 'BASE';

  protected workerId: string;
  protected modules: Modules;

  constructor({ modules, workerId }) {
    this.modules = modules;
    /* @ts-ignore */
    this.workerId = resolveWorkerId(workerId, this.constructor.type);
    /* @ts-ignore */
    log(`${this.constructor.key} -> Initialized: ${this.workerId}`);
    this.reset();
  }

  getInternalTypes() {
    return WorkerDirector.getActivePluginTypes().filter(
      (type) => type !== External.type
    );
  }

  start() {
    /* @ts-ignore */
    throw new Error(`Not implemented on ${this.constructor.key}`);
  }

  stop() {
    /* @ts-ignore */
    throw new Error(`Not implemented on ${this.constructor.key}`);
  }

  async reset(referenceDate = new Date()) {
    await this.modules.worker.markOldWorkAsFailed({
      types: this.getInternalTypes(),
      worker: this.workerId,
      referenceDate,
    });
  }

  async autorescheduleTypes(referenceDate: Date) {
    return Promise.all(
      WorkerDirector.getAutoSchedules().map(async ([type, work]) => {
        const { schedule, input, ...rest } = work;
        const fixedSchedule = { ...schedule };
        fixedSchedule.schedules[0].s = [0]; // ignore seconds, always run on second 0
        const nextDate = later.schedule(fixedSchedule).next(1, referenceDate);
        nextDate.setMilliseconds(0);
        await this.modules.worker.ensureOneWork({
          type,
          input: input(),
          scheduled: nextDate,
          worker: this.workerId,
          ...rest,
          retries: 0,
        });
      })
    );
  }

  async process(
    params: { maxWorkItemCount?: number; referenceDate?: Date } = {}
  ) {
    await this.autorescheduleTypes(params.referenceDate);
    const processRecursively = async (recursionCounter = 0) => {
      if (params.maxWorkItemCount && params.maxWorkItemCount < recursionCounter)
        return null;

      const work = await this.modules.worker.allocateWork({
        types: this.getInternalTypes(),
        worker: this.workerId,
      });

      let doneWork: Work | null = null;

      if (work) {
        const output = await this.modules.worker.doWork(work);

        doneWork = await this.modules.worker.finishWork(
          dbIdToString(work._id),
          {
            ...output,
            started: work.started,
            worker: this.workerId,
          },
          '0'
        );
      }
      if (doneWork) return processRecursively(recursionCounter + 1);

      return null;
    };

    await processRecursively();
  }

  static floorDate(d = new Date()) {
    const floored = new Date(Math.floor(d.getTime() / 1000) * 1000);
    return floored;
  }
}

export default BaseWorker;
