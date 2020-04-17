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
  finished: 'finished',
  deleted: 'deleted',
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

  static async work(selectorOptions) {
    return WorkQueue.findOne(this.buildQueueSelector(selectorOptions));
  }

  static defaultSortOrder() {
    // for all started operations (failed & success), they have to come descending (latest first),
    // after it's enqueue order: priority first, then prefer jobs that never run (original not set), then FIFO (created)
    return { started: -1, priority: -1, original: 1, created: 1 };
  }

  static async addWork({
    type,
    input,
    priority = 0,
    scheduled,
    original,
    retries,
  }) {
    if (!this.plugins[type]) {
      throw new Error(`No plugin registered for type ${type}`);
    }

    log(`${this.name} -> Work added ${type} ${scheduled} ${retries}`);

    const created = new Date();
    const workId = WorkQueue.insert({
      type,
      input,
      priority,
      scheduled: scheduled || created,
      original,
      retries,
      created,
    });

    const work = this.work({ workId });

    this.events.emit(WorkerEventTypes.added, { work });

    return work;
  }

  static buildQueueSelector({ status = [], workId, ...rest }) {
    const filterMap = {
      [WorkStatus.DELETED]: { deleted: { $exists: true } },
      [WorkStatus.NEW]: {
        started: { $exists: false },
        deleted: { $exists: false },
      },
      [WorkStatus.ALLOCATED]: {
        started: { $exists: true },
        finished: { $exists: false },
        deleted: { $exists: false },
      },
      [WorkStatus.SUCCESS]: { finished: { $exists: true }, success: true },
      [WorkStatus.FAILED]: { finished: { $exists: true }, success: false },
    };
    const statusQuery = {
      $or: Object.entries(filterMap).reduce(
        (acc, [key, filter]) => (status.includes(key) ? [...acc, filter] : acc),
        []
      ),
    };
    const query = statusQuery.$or.length > 0 ? statusQuery : {};
    if (workId) {
      query._id = workId;
    }
    return { ...query, ...rest };
  }

  static async workQueue({ skip, limit, ...selectorOptions }) {
    const result = WorkQueue.find(this.buildQueueSelector(selectorOptions), {
      skip,
      limit,
      sort: this.defaultSortOrder(),
    }).fetch();

    return result;
  }

  static async allocateWork({ types, worker = WORKER_ID }) {
    // Find a work item that is scheduled for now and is not started.
    // Also:
    // - Restrict by types and worker if provided
    // - Sort by default queue order
    const result = await WorkQueue.rawCollection().findAndModify(
      this.buildQueueSelector({
        status: WorkStatus.NEW,
        scheduled: { $lte: new Date() },
        worker: { $in: [null, worker] },
        ...(types ? { type: { $in: types } } : {}),
      }),
      this.defaultSortOrder(),
      {
        $set: { started: new Date(), worker },
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

  static async finishWork({
    workId,
    result,
    error,
    success,
    worker = WORKER_ID,
    started = new Date(),
    finished = new Date(),
  }) {
    const workBeforeUpdate = await this.work({
      workId,
      status: [WorkStatus.ALLOCATED],
    });
    if (!workBeforeUpdate) return null;

    WorkQueue.update(
      { _id: workId },
      {
        $set: {
          finished,
          success,
          error,
          result,
          ...(!workBeforeUpdate.started ? { started } : {}),
          worker,
        },
      }
    );

    const work = await this.work({ workId });

    log(`IN DIRECTOR ${workId} ${JSON.stringify(work)}`, { level: 'verbose' });

    this.events.emit(WorkerEventTypes.finished, { work });

    return work;
  }

  static async removeWork({ workId }) {
    const workBeforeRemoval = await this.work({
      workId,
      status: [WorkStatus.NEW, WorkStatus.ALLOCATED],
    });
    if (!workBeforeRemoval) return null;

    WorkQueue.update(
      { _id: workId },
      {
        $set: {
          deleted: new Date(),
        },
      }
    );

    const work = await this.work({ workId });
    this.events.emit(WorkerEventTypes.deleted, { work });

    return work;
  }

  static async findOneAndProcessWork({ types, worker }) {
    const work = await this.allocateWork({
      types,
      worker,
    });

    if (work) {
      const output = await this.doWork(work);
      return this.finishWork({
        ...output,
        workId: work._id,
        worker,
      });
    }
    return null;
  }
}

// eslint-disable-next-line import/prefer-default-export
export { WorkerDirector, WorkerEventTypes };
