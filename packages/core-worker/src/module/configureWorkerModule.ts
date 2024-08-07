import type { WorkData, WorkResult } from '../worker-index.js';
import type { ModuleInput, ModuleMutations, UnchainedCore } from '@unchainedshop/core';

import os from 'os';
import { createLogger } from '@unchainedshop/logger';
import {
  generateDbFilterById,
  generateDbMutations,
  buildSortOptions,
  mongodb,
} from '@unchainedshop/mongodb';
import { emit, registerEvents } from '@unchainedshop/events';
import { buildObfuscatedFieldsFilter, SortDirection, SortOption } from '@unchainedshop/utils';
import { WorkQueueCollection } from '../db/WorkQueueCollection.js';
import { WorkQueueSchema } from '../db/WorkQueueSchema.js';
import { DIRECTOR_MARKED_FAILED_ERROR, WorkerDirector } from '../director/WorkerDirector.js';
import { WorkerEventTypes } from '../director/WorkerEventTypes.js';
import { WorkStatus } from '../director/WorkStatus.js';
import { Work } from '../types.js';

const { UNCHAINED_WORKER_ID = os.hostname() } = process.env;

const logger = createLogger('unchained:core-worker');

export interface WorkerSettingsOptions {
  blacklistedVariables?: string[];
}

export type WorkQueueQuery = {
  created?: { end?: Date; start?: Date };
  types?: Array<string>;
  status: Array<WorkStatus>;
  queryString?: string;
  scheduled?: { end?: Date; start?: Date };
};

export type WorkerModule = {
  activeWorkTypes: () => Promise<Array<string>>;
  findWork: (query: { workId?: string; originalWorkId?: string }) => Promise<Work>;
  findWorkQueue: (
    query: WorkQueueQuery & {
      sort?: Array<SortOption>;
      limit?: number;
      skip?: number;
    },
  ) => Promise<Array<Work>>;
  count: (query: WorkQueueQuery) => Promise<number>;
  workExists: (query: { workId?: string; originalWorkId?: string }) => Promise<boolean>;

  // Transformations
  status: (work: Work) => WorkStatus;

  type: (work: Work) => string;

  // Mutations
  addWork: (data: WorkData) => Promise<Work>;

  allocateWork: (doc: { types: Array<string>; worker: string }) => Promise<Work>;

  processNextWork: (unchainedAPI: UnchainedCore, workerId?: string) => Promise<Work>;

  rescheduleWork: (work: Work, scheduled: Date, unchainedAPI: UnchainedCore) => Promise<Work>;

  ensureOneWork: (work: WorkData, workId: string) => Promise<Work>;

  ensureNoWork: (work: { priority: number; type: string }) => Promise<void>;

  finishWork: (
    _id: string,
    data: WorkResult<any> & {
      finished?: Date;
      started?: Date;
      worker?: string;
    },
  ) => Promise<Work | null>;

  deleteWork: (_id: string) => Promise<Work | null>;

  markOldWorkAsFailed: (params: {
    types: Array<string>;
    worker: string;
    referenceDate: Date;
  }) => Promise<Array<Work>>;
};

export const buildQuerySelector = ({
  created,
  scheduled,
  types,
  status,
  workId,
  queryString,
  ...rest
}: mongodb.Filter<Work> & {
  created?: { end?: Date; start?: Date };
  scheduled?: { end?: Date; start?: Date };
  status?: Array<WorkStatus>;
  workId?: string;
  queryString?: string;
  types?: Array<string>;
}) => {
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
    [WorkStatus.SUCCESS]: {
      finished: { $exists: true },
      success: true,
      deleted: { $exists: false },
    },
    [WorkStatus.FAILED]: {
      finished: { $exists: true },
      success: false,
      deleted: { $exists: false },
    },
  };
  const statusQuery = {
    $or: Object.entries(filterMap).reduce(
      (acc, [key, filter]) => (status?.includes(key as WorkStatus) ? [...acc, filter] : acc),
      [],
    ),
  };

  let query: mongodb.Filter<Work> =
    statusQuery.$or.length > 0 ? statusQuery : { deleted: { $exists: false } };

  if (created) {
    query.created = created?.end
      ? { $gte: created.start || new Date(0), $lte: created.end }
      : { $gte: created.start || new Date(0) };
  }
  if (scheduled) {
    query.scheduled = scheduled?.end
      ? { $gte: scheduled.start || new Date(0), $lte: scheduled.end }
      : { $gte: scheduled.start || new Date(0) };
  }
  if (types && Array.isArray(types)) {
    query.type = { $in: types };
  }

  if (workId) {
    query = generateDbFilterById(workId, query);
  }
  if (queryString) (query as any).$text = { $search: queryString };

  return { ...query, ...rest };
};

const defaultSort: Array<{ key: string; value: SortDirection }> = [
  { key: 'started', value: SortDirection.DESC },
  { key: 'priority', value: SortDirection.DESC },
  { key: 'originalWorkId', value: SortDirection.ASC },
  { key: 'created', value: SortDirection.ASC },
];

export const configureWorkerModule = async ({
  db,
  options,
}: ModuleInput<WorkerSettingsOptions>): Promise<WorkerModule> => {
  registerEvents(Object.values(WorkerEventTypes));

  const WorkQueue = await WorkQueueCollection(db);

  const removePrivateFields = buildObfuscatedFieldsFilter(options?.blacklistedVariables);

  const mutations = generateDbMutations<Work>(WorkQueue, WorkQueueSchema) as ModuleMutations<Work>;

  const allocateWork: WorkerModule['allocateWork'] = async ({ types, worker = UNCHAINED_WORKER_ID }) => {
    // Find a work item that is scheduled for now and is not started.
    // Also:
    // - Restrict by types and worker if provided
    // - Sort by default queue order
    const query = buildQuerySelector({
      status: [WorkStatus.NEW],
      scheduled: { end: new Date() },
      worker: { $in: [null, '', worker] },
      ...(types ? { type: { $in: types } } : {}),
    });
    const result = await WorkQueue.findOneAndUpdate(
      query,
      {
        $set: { started: new Date(), worker },
      },
      { sort: buildSortOptions(defaultSort), returnDocument: 'after' },
    );

    if (result) {
      emit(WorkerEventTypes.ALLOCATED, removePrivateFields(result));
    }

    return result;
  };

  const finishWork: WorkerModule['finishWork'] = async (
    workId,
    {
      error,
      finished = new Date(),
      result,
      started = new Date(),
      success,
      worker = UNCHAINED_WORKER_ID,
    },
  ) => {
    const workBeforeUpdate = await WorkQueue.findOne(
      buildQuerySelector({ workId, status: [WorkStatus.ALLOCATED] }),
    );

    if (!workBeforeUpdate) return null;

    await mutations.update(workId, {
      $set: {
        finished,
        success,
        error,
        result,
        ...(!workBeforeUpdate.started ? { started } : {}),
        worker,
      },
    });

    const work = await WorkQueue.findOne(generateDbFilterById(workId), {});

    const duration = new Date(work.finished).getTime() - new Date(work.started).getTime();
    if (work.success) {
      logger.info(`${work.type} finished with success (${duration}ms)`, {
        workId,
        worker,
      });
    } else {
      logger.warn(`${work.type} finished with errors (${duration}ms) / ${work.retries} remaining`, {
        workId,
        worker,
      });
    }
    logger.debug(`work details:`, { work });
    emit(WorkerEventTypes.FINISHED, removePrivateFields(work));

    return work;
  };

  const processNextWork: WorkerModule['processNextWork'] = async (unchainedAPI, workerId) => {
    const adapters = WorkerDirector.getAdapters();

    const alreadyAllocatedWork = await WorkQueue.aggregate(
      [
        {
          $match: {
            started: {
              $exists: true,
            },
            finished: {
              $exists: false,
            },
            deleted: {
              $exists: false,
            },
          },
        },
        {
          $group: {
            _id: '$type',
            count: {
              $sum: 1,
            },
          },
        },
      ],
      {
        allowDiskUse: false,
      },
    ).toArray();

    const allocationMap = Object.fromEntries(alreadyAllocatedWork.map((w) => [w._id, w.count]));

    const types = adapters
      .filter((adapter) => {
        // Filter out the external
        if (adapter.external) return false;
        if (
          adapter.maxParallelAllocations &&
          adapter.maxParallelAllocations <= allocationMap[adapter.type]
        )
          return false;
        return true;
      })
      .map((adapter) => adapter.type);

    const worker = workerId ?? UNCHAINED_WORKER_ID;
    const work = await allocateWork({
      types,
      worker,
    });

    if (work) {
      const output = await WorkerDirector.doWork(work, unchainedAPI);

      return finishWork(work._id, {
        ...output,
        finished: work.finished || new Date(),
        started: work.started,
        worker,
      });
    }

    return null;
  };

  return {
    // Queries
    activeWorkTypes: async () => {
      const typeList = await WorkQueue.aggregate([{ $group: { _id: '$type' } }]).toArray();
      return typeList
        .map((t) => t._id as string)
        .filter((type) => {
          return WorkerDirector.getActivePluginTypes().includes(type);
        });
    },

    findWork: async ({ workId, originalWorkId }) =>
      WorkQueue.findOne(workId ? generateDbFilterById(workId) : { originalWorkId }, {}),

    findWorkQueue: async ({ limit, skip, sort, ...selectorOptions }) => {
      const selector = buildQuerySelector(selectorOptions);
      return WorkQueue.find(selector, {
        skip,
        limit,
        sort: buildSortOptions(sort || defaultSort),
      }).toArray();
    },

    count: async (query) => {
      return WorkQueue.countDocuments(buildQuerySelector(query));
    },

    workExists: async ({ workId, originalWorkId }) => {
      const queueCount = await WorkQueue.countDocuments(
        workId ? generateDbFilterById(workId) : { originalWorkId },
        { limit: 1 },
      );
      return !!queueCount;
    },

    // Transformations

    type: (work) => {
      if (WorkerDirector.getActivePluginTypes().includes(work.type)) {
        return work.type;
      }
      return 'UNKNOWN';
    },

    status: (work) => {
      if (work.deleted) {
        return WorkStatus.DELETED;
      }
      if (!work.started && !work.finished) {
        return WorkStatus.NEW;
      }
      if (work.started && !work.finished) {
        return WorkStatus.ALLOCATED;
      }
      if (work.started && work.finished && work.success) {
        return WorkStatus.SUCCESS;
      }
      if (work.started && work.finished && !work.success) {
        return WorkStatus.FAILED;
      }

      logger.error(`${work.type} is in unexpected state`, { workId: work._id });

      throw new Error('Unexpected work status');
    },

    // Mutations
    addWork: async ({
      type,
      input,
      priority = 0,
      scheduled,
      originalWorkId,
      worker = null,
      retries = 20,
    }) => {
      if (!WorkerDirector.getAdapterByType(type)) {
        throw new Error(`No plugin registered for type ${type}`);
      }

      const created = new Date();
      const workId = await mutations.create({
        type,
        input,
        priority,
        scheduled: scheduled || created,
        originalWorkId,
        retries,
        created,
        worker,
      });

      logger.info(`${type} scheduled @ ${new Date(scheduled || created).toISOString()}`, {
        workId,
      });

      const work = await WorkQueue.findOne(generateDbFilterById(workId), {});
      emit(WorkerEventTypes.ADDED, removePrivateFields(work));

      return work;
    },

    rescheduleWork: async (currentWork, scheduled) => {
      await mutations.update(currentWork._id, {
        $set: {
          scheduled,
        },
      });

      const work = await WorkQueue.findOne(generateDbFilterById(currentWork._id), {});
      emit(WorkerEventTypes.RESCHEDULED, {
        work: removePrivateFields(work),
        oldScheduled: currentWork.scheduled,
      });

      return work;
    },

    allocateWork,

    ensureNoWork: async ({ type, priority = 0 }) => {
      const query = buildQuerySelector({
        type,
        status: [WorkStatus.NEW],
        priority,
        autoscheduled: true,
      });

      await WorkQueue.updateMany(query, {
        $set: {
          deleted: new Date(),
        },
      });
    },

    ensureOneWork: async (
      { type, input, priority = 0, scheduled, timeout, originalWorkId, retries = 20 },
      workId,
    ) => {
      const created = new Date();
      const query = buildQuerySelector({
        type,
        status: [WorkStatus.NEW],
        priority,
        autoscheduled: true,
      });
      try {
        const result = await WorkQueue.findOneAndUpdate(
          query,
          {
            $set: {
              input,
              worker: null,
              updated: created,
              retries,
              timeout,
              originalWorkId,
            },
            $unset: {
              deleted: 1,
            },
            $setOnInsert: {
              _id: workId,
              scheduled,
              type,
              created,
              autoscheduled: true,
              priority,
            },
          },
          {
            sort: buildSortOptions(defaultSort),
            returnDocument: 'after',
            includeResultMetadata: true,
            upsert: true,
          },
        );
        if (!result.lastErrorObject.updatedExisting) {
          logger.info(`${type} auto-scheduled @ ${new Date(scheduled).toISOString()}`, {
            workId,
          });
          emit(WorkerEventTypes.ADDED, removePrivateFields(result.value));
        }
        return result.value;
      } catch (e) {
        /* TODO: 
        If the findOneAndUpdate call failed because of _id conflict with a DELETED work,
        we should permanently remove the conflicting deleted work 
        and retry the findOneAndUpdate call.
        */
        return null;
      }
    },

    processNextWork,

    finishWork,

    deleteWork: async (workId) => {
      const workBeforeRemoval = await WorkQueue.findOne(
        buildQuerySelector({
          workId,
          status: [WorkStatus.NEW, WorkStatus.ALLOCATED],
        }),
      );
      if (!workBeforeRemoval) return null;

      await mutations.delete(workId);

      const work = await WorkQueue.findOne(generateDbFilterById(workId), {});
      emit(WorkerEventTypes.DELETED, removePrivateFields(work));

      return work;
    },

    markOldWorkAsFailed: async ({ types, worker = UNCHAINED_WORKER_ID, referenceDate }) => {
      const workQueue = await WorkQueue.find(
        buildQuerySelector({
          status: [WorkStatus.ALLOCATED],
          started: { $lte: referenceDate },
          worker: { $in: [worker, '', null] }, // Don't mark work failed of other workers!
          type: { $in: types },
        }),
        { projection: { _id: true }, sort: { test: 1 } },
      ).toArray();

      return Promise.all(
        workQueue.map(({ _id }) =>
          finishWork(_id as string, {
            finished: new Date(),
            result: null,
            success: false,
            error: {
              name: DIRECTOR_MARKED_FAILED_ERROR,
              message:
                'Director marked old work as failed after restart. This work was eventually running at the moment when node.js exited.',
            },
            worker,
          }),
        ),
      );
    },
  };
};
