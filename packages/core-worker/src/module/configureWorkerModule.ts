import {
  Filter,
  ModifyResult,
  ModuleInput,
  ModuleMutations,
  Projection,
  Query,
  Sort,
} from '@unchainedshop/types/common';
import { WorkerModule, Work } from '@unchainedshop/types/worker';
import { log, LogLevel } from 'meteor/unchained:logger';
import {
  generateDbFilterById,
  generateDbMutations,
} from 'meteor/unchained:utils';
import os from 'os';
import { WorkStatus } from '../director/WorkStatus';
import { WorkQueueCollection } from '../db/WorkQueueCollection';
import { WorkQueueSchema } from '../db/WorkQueueSchema';
import {
  DIRECTOR_MARKED_FAILED_ERROR,
  WorkerDirector,
} from '../director/WorkerDirector';
import { WorkerEventTypes } from '../director/WorkerEventTypes';

const { UNCHAINED_WORKER_ID = os.hostname() } = process.env;

const buildQuerySelector = ({
  created = { start: null, end: null },
  selectTypes = [],
  status = [],
  workId,
  ...rest
}: Query & {
  created?: { end?: Date; start?: Date };
  selectTypes?: Array<string>;
  status?: Array<WorkStatus>;
  workId?: string;
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
      (acc, [key, filter]) =>
        status.includes(key as WorkStatus) ? [...acc, filter] : acc,
      []
    ),
  };

  let query: Filter<Work> = statusQuery.$or.length > 0 ? statusQuery : {};

  query.$and = [
    selectTypes?.length > 0 && { type: { $in: selectTypes } },
    created?.end
      ? { created: { $gte: created.start, $lte: created.end } }
      : { created: { $gte: created?.start || new Date(0) } },
  ].filter(Boolean);

  if (workId) {
    query = generateDbFilterById(workId, query);
  }

  return { ...query, ...rest };
};

const defaultSort = {
  started: -1,
  priority: -1,
  originalWorkId: 1,
  created: 1,
} as Sort;

export const configureWorkerModule = async ({
  db,
}: ModuleInput<{}>): Promise<WorkerModule> => {
  const WorkQueue = await WorkQueueCollection(db);

  const mutations = generateDbMutations<Work>(
    WorkQueue,
    WorkQueueSchema
  ) as ModuleMutations<Work>;

  const finishWork: WorkerModule['finishWork'] = async (
    workId,
    { error, finished, result, started, success, worker = UNCHAINED_WORKER_ID },
    userId
  ) => {
    const workBeforeUpdate = await WorkQueue.findOne(
      buildQuerySelector({ workId, status: [WorkStatus.ALLOCATED] })
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
      userId
    );

    const work = await WorkQueue.findOne(generateDbFilterById(workId));

    log(`Finished work ${workId}`, {
      level: LogLevel.Verbose,
      work,
    });

    WorkerDirector.emit(WorkerEventTypes.FINISHED, { work, userId });

    return work;
  };

  return {
    // Queries
    activeWorkTypes: async () => {
      const typeList = await WorkQueue.aggregate([
        { $group: { _id: '$type' } },
      ]).toArray();
      return typeList.map((t) => t._id);
    },

    findWork: async ({ workId, originalWorkId }) => {
      return await WorkQueue.findOne(
        workId ? generateDbFilterById(workId) : { originalWorkId }
      );
    },

    findWorkQueue: async ({ limit, skip, ...selectorOptions }) => {
      const workQueues = WorkQueue.find(buildQuerySelector(selectorOptions), {
        skip,
        limit,
        sort: defaultSort,
      });

      return await workQueues.toArray();
    },

    workExists: async ({ workId, originalWorkId }) => {
      const queueCount = await WorkQueue.find(
        workId ? generateDbFilterById(workId) : { originalWorkId },
        { limit: 1 }
      ).count();
      return !!queueCount;
    },

    // Transformations
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
    addWork: async (
      { type, input, priority = 0, scheduled, originalWorkId, retries = 20 },
      userId
    ) => {
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
        userId
      );

      log(
        `WorkerDirector -> Work added ${workId} (${type} / ${
          scheduled || created
        } / ${retries})`,
        { userId }
      );

      const work = await WorkQueue.findOne(generateDbFilterById(workId));

      WorkerDirector.emit(WorkerEventTypes.ADDED, { work, userId });

      return work;
    },

    allocateWork: async ({ types, worker = UNCHAINED_WORKER_ID }) => {
      // Find a work item that is scheduled for now and is not started.
      // Also:
      // - Restrict by types and worker if provided
      // - Sort by default queue order
      const query = buildQuerySelector({
        status: [WorkStatus.NEW],
        scheduled: { $lte: new Date() },
        worker: { $in: [null, worker] },
        ...(types ? { type: { $in: types } } : {}),
      });
      const result = await /* @ts-ignore */
      (Work.findOneAndUpdate(
        query,
        {
          $set: { started: new Date(), worker },
        },
        { sort: defaultSort, returnNewDocument: true }
      ) as Promise<ModifyResult<Work>>);

      WorkerDirector.emit(WorkerEventTypes.ALLOCATED, { work: result.value });

      return result.value;
    },

    ensureOneWork: async ({
      type,
      input,
      priority = 0,
      scheduled,
      originalWorkId,
      retries = 20,
    }) => {
      const created = new Date();
      const query = buildQuerySelector({
        type,
        status: [WorkStatus.NEW],
      });
      try {
        const workId = `${type}:${scheduled.getTime()}`;
        const result = await /* @ts-ignore */
        (Work.findOneAndUpdate(
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
            sort: defaultSort,
            returnNewDocument: true,
            upsert: true,
          }
        ) as Promise<ModifyResult<Work>>);

        if (!result.lastErrorObject.updatedExisting) {
          log(
            `WorkerDirector -> Work added again (ensure) ${type} ${scheduled} ${retries}`
          );

          WorkerDirector.emit(WorkerEventTypes.ADDED, {
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
        })
      );
      if (!workBeforeRemoval) return null;

      await mutations.delete(workId, userId);

      const work = await WorkQueue.findOne(generateDbFilterById(workId));

      WorkerDirector.emit(WorkerEventTypes.DELETED, { work, userId });

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
        { type: 1, sort: { test: 1 } } as Projection<Work>
      ).toArray();

      return Promise.all(
        workQueue.map(
          async ({ _id }) =>
            await finishWork(
              typeof _id === 'string' ? _id : _id.toHexString(),
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
              userId
            )
        )
      );
    },
  };
};
