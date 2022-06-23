import {
  ModifyResult,
  ModuleInput,
  ModuleMutations,
  Projection,
  Query,
} from '@unchainedshop/types/common';
import { Work, WorkerModule } from '@unchainedshop/types/worker';
import { log, LogLevel } from '@unchainedshop/logger';
import { generateDbFilterById, generateDbMutations, buildSortOptions } from 'meteor/unchained:utils';
import os from 'os';
import { WorkQueueCollection } from '../db/WorkQueueCollection';
import { WorkQueueSchema } from '../db/WorkQueueSchema';
import { DIRECTOR_MARKED_FAILED_ERROR, WorkerDirector } from '../director/WorkerDirector';
import { WorkerEventTypes } from '../director/WorkerEventTypes';
import { WorkStatus } from '../director/WorkStatus';

const { UNCHAINED_WORKER_ID = os.hostname() } = process.env;

const buildQuerySelector = ({
  created,
  scheduled,
  types,
  status,
  workId,
  queryString,
  ...rest
}: Query & {
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

  let query: Query = statusQuery.$or.length > 0 ? statusQuery : { deleted: { $exists: false } };

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
  if (types) {
    query.type = { $in: types };
  }

  if (workId) {
    query = generateDbFilterById(workId, query);
  }
  if (queryString) query.$text = { $search: queryString };

  return { ...query, ...rest };
};

const defaultSort: Array<{ key: string; value: 'DESC' | 'ASC' }> = [
  { key: 'started', value: 'DESC' },
  { key: 'priority', value: 'DESC' },
  { key: 'originalWorkId', value: 'ASC' },
  { key: 'created', value: 'ASC' },
];

export const configureWorkerModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<WorkerModule> => {
  const WorkQueue = await WorkQueueCollection(db);

  const mutations = generateDbMutations<Work>(WorkQueue, WorkQueueSchema) as ModuleMutations<Work>;

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
    userId,
  ) => {
    const workBeforeUpdate = await WorkQueue.findOne(
      buildQuerySelector({ workId, status: [WorkStatus.ALLOCATED] }),
    );

    if (!workBeforeUpdate) return null;

    await mutations.update(
      workId,
      {
        $set: {
          finished,
          success,
          error,
          result,
          ...(!workBeforeUpdate.started ? { started } : {}),
          worker,
        },
      },
      userId,
    );

    const work = await WorkQueue.findOne(generateDbFilterById(workId), {});

    log(`Finished work ${workId}`, {
      level: LogLevel.Verbose,
      work,
    });

    WorkerDirector.events.emit(WorkerEventTypes.FINISHED, { work, userId });

    return work;
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
      const workQueues = WorkQueue.find(selector, {
        skip,
        limit,
        sort: buildSortOptions(sort),
      });

      return workQueues.toArray();
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

      log('Unexpected work status', { level: LogLevel.Warning });

      throw new Error('Unexpected work status');
    },

    // Mutations
    addWork: async ({ type, input, priority = 0, scheduled, originalWorkId, retries = 20 }, userId) => {
      if (!WorkerDirector.getAdapter(type)) {
        throw new Error(`No plugin registered for type ${type}`);
      }

      const created = new Date();
      const workId = await mutations.create(
        {
          type,
          input,
          priority,
          scheduled: scheduled || created,
          originalWorkId,
          retries,
          created,
        },
        userId,
      );

      log(`WorkerDirector -> Work added ${workId} (${type} / ${scheduled || created} / ${retries})`, {
        userId,
      });

      const work = await WorkQueue.findOne(generateDbFilterById(workId), {});

      WorkerDirector.events.emit(WorkerEventTypes.ADDED, { work, userId });

      return work;
    },

    rescheduleWork: async (currentWork, scheduled, { userId }) => {
      await mutations.update(
        currentWork._id,
        {
          $set: {
            scheduled,
          },
        },
        userId,
      );

      const work = await WorkQueue.findOne(generateDbFilterById(currentWork._id), {});

      WorkerDirector.events.emit(WorkerEventTypes.RESCHEDULED, {
        work,
        oldScheduled: currentWork.scheduled,
        userId,
      });

      return work;
    },

    allocateWork: async ({ types, worker = UNCHAINED_WORKER_ID }) => {
      // Find a work item that is scheduled for now and is not started.
      // Also:
      // - Restrict by types and worker if provided
      // - Sort by default queue order
      const query = buildQuerySelector({
        status: [WorkStatus.NEW],
        scheduled: { end: new Date() },
        worker: { $in: [null, worker] },
        ...(types ? { type: { $in: types } } : {}),
      });
      const result = await WorkQueue.findOneAndUpdate(
        query,
        {
          $set: { started: new Date(), worker },
        },
        { sort: buildSortOptions(defaultSort), returnDocument: 'after' },
      );

      WorkerDirector.events.emit(WorkerEventTypes.ALLOCATED, {
        work: result.value,
      });

      return result.value;
    },

    ensureOneWork: async ({ type, input, priority = 0, scheduled, originalWorkId, retries = 20 }) => {
      const created = new Date();
      const query = buildQuerySelector({
        type,
        status: [WorkStatus.NEW],
      });
      try {
        const workId = `${type}:${scheduled.getTime()}`;
        const result = await (WorkQueue.findOneAndUpdate(
          query,
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
            sort: buildSortOptions(defaultSort),
            returnDocument: 'after',
            upsert: true,
          },
        ) as Promise<ModifyResult<Work>>);

        if (!result.lastErrorObject.updatedExisting) {
          log(`WorkerDirector -> Work added again (ensure) ${type} ${scheduled} ${retries}`);

          WorkerDirector.events.emit(WorkerEventTypes.ADDED, {
            work: result.value,
          });
        }
        return result.value;
      } catch (e) {
        return null;
      }
    },

    doWork: (work, requestContext) => {
      return WorkerDirector.doWork(work, requestContext);
    },

    finishWork,

    deleteWork: async (workId, userId) => {
      const workBeforeRemoval = await WorkQueue.findOne(
        buildQuerySelector({
          workId,
          status: [WorkStatus.NEW, WorkStatus.ALLOCATED],
        }),
      );
      if (!workBeforeRemoval) return null;

      await mutations.delete(workId, userId);

      const work = await WorkQueue.findOne(generateDbFilterById(workId), {});

      WorkerDirector.events.emit(WorkerEventTypes.DELETED, { work, userId });

      return work;
    },

    markOldWorkAsFailed: async ({ types, worker, referenceDate }, userId) => {
      const workQueue = await WorkQueue.find(
        buildQuerySelector({
          status: [WorkStatus.ALLOCATED],
          started: { $lte: referenceDate },
          worker,
          type: { $in: types },
        }),
        { type: 1, sort: { test: 1 } } as Projection<Work>,
      ).toArray();

      return Promise.all(
        workQueue.map(({ _id }) =>
          finishWork(
            _id as string,
            {
              finished: new Date(),
              result: null,
              success: false,
              error: {
                name: DIRECTOR_MARKED_FAILED_ERROR,
                message:
                  'Director marked old work as failed after restart. This work was eventually running at the moment when node.js exited.',
              },
              worker,
            },
            userId,
          ),
        ),
      );
    },
  };
};
