import os from 'os';
import { EventEmitter } from 'events';
import { log } from 'meteor/unchained:core-logger';

import { WorkQueue } from './db/collections';
import { WorkStatus } from './db/schema';

const { WORKER_ID = os.hostname() } = process.env;

const WorkerEventTypes = {
  added: 'added',
  allocated: 'allocated',
  done: 'done',
  finished: 'finished'
  // The difference between `done` and `finished` is, that work is `done` after
  // it was computed (no DB write, could be external) and `finished` after
  // the changes are written to the DB
};

class WorkerDirector {
  static plugins = {};

  static events = new EventEmitter();

  static registerPlugin(plugin /* WorkerPlugin */) {
    if (this.plugins[plugin.type])
      throw new Error(
        `${this.name}: There is already a plugin registered with type: ${plugin.type}`
      );

    this.plugins[plugin.type] = plugin;

    log(
      `${this.name} -> Registered ${plugin.type} ${plugin.key}@${plugin.version} (${plugin.label})`
    );
  }

  static getActivePluginTypes() {
    return Object.keys(this.plugins);
  }

  static addWork({
    type,
    input,
    priority = 0,
    scheduled = new Date(0),
    original,
    retries
  }) {
    if (!this.plugins[type]) {
      throw new Error(`No plugin registered for type ${type}`);
    }

    log(`${this.name} -> Work added ${type} ${scheduled} ${retries}`);

    const _id = WorkQueue.insert({
      type,
      input,
      priority,
      scheduled,
      original,
      retries,
      created: new Date()
    });

    const work = WorkQueue.findOne({ _id });

    this.events.emit(WorkerEventTypes.added, { work });

    return work;
  }

  static workQueue({ status = [] }) {
    const filterMap = {
      [WorkStatus.NEW]: { started: { $exists: false } },
      [WorkStatus.ALLOCATED]: {
        $and: [{ started: { $exists: true } }, { finished: { $exists: false } }]
      },
      [WorkStatus.SUCCESS]: { finished: { $exists: true }, success: true },
      [WorkStatus.FAILED]: { finished: { $exists: true }, success: false }
    };

    const query = {
      $or: Object.entries(filterMap).reduce(
        (acc, [key, filter]) => (status.includes(key) ? [...acc, filter] : acc),
        []
      )
    };

    const result = WorkQueue.find(query.$or.length > 0 ? query : {}).fetch();

    return result;
  }

  static async allocateWork({ types, worker = WORKER_ID }) {
    const result = await WorkQueue.rawCollection().findAndModify(
      {
        started: null,
        scheduled: { $lt: new Date() },
        worker: { $in: [null, worker] },
        ...(types ? { type: { $in: types } } : {})
      },
      { created: 1, priority: -1 },
      {
        $set: { started: new Date(), worker }
      },
      { new: true }
    );

    this.events.emit(WorkerEventTypes.allocated, { work: result.value });

    return result.value;
  }

  static async doWork({ type, input }) {
    const plugin = this.plugins[type];

    if (!plugin) log(`${this.name}: No registered plugin for type: ${type}`);

    try {
      const output = await plugin.doWork(input);

      this.events.emit(WorkerEventTypes.done, { output });

      return output;
    } catch (error) {
      // DO not use this as flow control. The plugin should catch expected errors and return status: FAILED
      log('DO not use this as flow control.', { level: 'verbose' });

      log(`${this.name} -> Error doing work ${type}: ${error.message}`);

      const output = { error, success: false };

      this.events.emit(WorkerEventTypes.done, { output });

      return output;
    }
  }

  static finishWork({
    workId,
    result,
    error,
    success,
    worker = WORKER_ID,
    started = new Date(),
    finished = new Date()
  }) {
    const originalWork = WorkQueue.findOne({ _id: workId });

    WorkQueue.update(
      { _id: workId },
      {
        $set: {
          finished,
          success,
          error,
          result,
          ...(!originalWork.started ? { started } : {}),
          worker
        }
      }
    );

    const work = WorkQueue.findOne({ _id: workId });

    log(`IN DIRECTOR ${workId} ${JSON.stringify(work)}`, { level: 'verbose' });

    this.events.emit(WorkerEventTypes.finished, { work });

    return work;
  }
}

// eslint-disable-next-line import/prefer-default-export
export { WorkerDirector, WorkerEventTypes };
