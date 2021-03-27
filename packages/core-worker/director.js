import os from 'os';
import { EventEmitter } from 'events';
import { log } from 'meteor/unchained:core-logger';

import { WorkQueue } from './db/collections';
import { WorkStatus } from './db/schema';

const { UNCHAINED_WORKER_ID = os.hostname() } = process.env;

export const DIRECTOR_MARKED_FAILED_ERROR = 'DIRECTOR_MARKED_FAILED';

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

class WorkerPlugin {
  static key = '';

  static label = '';

  static version = '';

  static type = '';

  static async doWork() {
    return { success: false, result: null };
  }
}

class WorkerDirector {
  static plugins = {};

  static autoSchedule = {};

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

  static configureAutoscheduling(plugin, configuration) {
    const { schedule } = configuration;
    this.autoSchedule[plugin.type] = configuration;
    log(
      `${this.name} -> Configured ${plugin.type} ${plugin.key}@${plugin.version} (${plugin.label}) for Autorun at ${schedule}`
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
    return { started: -1, priority: -1, originalWorkId: 1, created: 1 };
  }

  static async ensureOneWork(addWorkData) {
    const {
      type,
      input,
      priority = 0,
      scheduled,
      originalWorkId,
      retries = 20,
    } = addWorkData;

    const created = new Date();
    const selector = this.buildQueueSelector({
      type,
      status: [WorkStatus.NEW],
    });
    try {
      const workId = `${type}:${scheduled.getTime()}`;
      const result = await WorkQueue.rawCollection().findAndModify(
        selector,
        this.defaultSortOrder(),
        {
          $set: {
            input,
            priority,
            worker: null,
            updated: created,
          },
          $setOnInsert: {
            _id: workId,
            type,
            originalWorkId,
            scheduled,
            retries,
            created,
          },
        },
        {
          upsert: true,
        }
      );
      if (!result.lastErrorObject.updatedExisting) {
        log(
          `${this.name} -> Work added again (ensure) ${type} ${scheduled} ${retries}`
        );
        const work = await this.work({ workId });
        this.events.emit(WorkerEventTypes.added, { work });
      }
      return result.value;
    } catch (e) {
      return null;
    }
  }

  static async addWork({
    type,
    input,
    priority = 0,
    scheduled: rawScheduled,
    originalWorkId,
    retries = 20,
  }) {
    if (!this.plugins[type]) {
      throw new Error(`No plugin registered for type ${type}`);
    }

    const created = new Date();
    const scheduled = rawScheduled || created;
    const workId = WorkQueue.insert({
      type,
      input,
      priority,
      scheduled,
      originalWorkId,
      retries,
      created,
    });

    log(`${this.name} -> Work added ${type} ${scheduled} ${retries}`);
    const work = await this.work({ workId });
    this.events.emit(WorkerEventTypes.added, { work });

    return work;
  }

  static buildQueueSelector({
    status = [],
    selectTypes = [],
    startDate,
    endDate = new Date(),
    workId,
    ...rest
  }) {
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
    query.$and = [
      selectTypes?.length > 0 && { type: { $in: selectTypes } },
      startDate
        ? { created: { $gte: startDate, $lte: endDate } }
        : { created: { $lte: endDate } },
    ].filter(Boolean);

    if (workId) {
      query._id = workId;
    }
    return { ...query, ...rest };
  }

  static async activeWorkTypes() {
    const typeList = await WorkQueue.rawCollection()
      .aggregate([{ $group: { _id: '$type' } }])
      .toArray();
    return typeList.map((t) => t._id);
  }

  static workQueue({ skip, limit, ...selectorOptions }) {
    const result = WorkQueue.find(this.buildQueueSelector(selectorOptions), {
      skip,
      limit,
      sort: this.defaultSortOrder(),
    }).fetch();

    return result;
  }

  static async allocateWork({ types, worker = UNCHAINED_WORKER_ID }) {
    // Find a work item that is scheduled for now and is not started.
    // Also:
    // - Restrict by types and worker if provided
    // - Sort by default queue order
    const result = await WorkQueue.rawCollection().findAndModify(
      this.buildQueueSelector({
        status: [WorkStatus.NEW],
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

  static async doWork({ type, input, ...options }) {
    const plugin = this.plugins[type];

    if (!plugin) log(`${this.name}: No registered plugin for type: ${type}`);

    try {
      const output = await plugin.doWork(input, options);

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
    worker = UNCHAINED_WORKER_ID,
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

  static async markOldWorkFailed({ types, worker, referenceDate }) {
    const workItems = WorkQueue.find(
      this.buildQueueSelector({
        status: [WorkStatus.ALLOCATED],
        started: { $lte: referenceDate },
        worker,
        type: { $in: types },
      }),
      { fields: { _id: 1 } }
    ).fetch();

    return Promise.all(
      workItems.map(async ({ _id }) => {
        return this.finishWork({
          result: null,
          success: false,
          error: {
            name: DIRECTOR_MARKED_FAILED_ERROR,
            message:
              'Director marked old work as failed after restart. This work was eventually running at the moment when node.js exited.',
          },
          workId: _id,
          worker,
        });
      })
    );
  }
}

// eslint-disable-next-line import/prefer-default-export
export { WorkerDirector, WorkerEventTypes, WorkerPlugin };
