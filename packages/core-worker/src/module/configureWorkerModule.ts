import {
  Filter, ModifyResult, ModuleInput,
  ModuleMutations, Projection, Query,
  Sort
} from '@unchainedshop/types/common';
import {
  WorkerModule,
  WorkQueue,
  WorkStatus
} from '@unchainedshop/types/worker';
import { registerEvents } from 'meteor/unchained:events';
import { log, LogLevel } from 'meteor/unchained:logger';
import {
  generateDbFilterById,
  generateDbMutations
} from 'meteor/unchained:utils';
import os from 'os';
import { WorkQueuesCollection } from '../db/WorkQueuesCollection';
import { WorkQueuesSchema } from '../db/WorkQueuesSchema';
import {
  DIRECTOR_MARKED_FAILED_ERROR,
  WorkerDirector
} from '../director/WorkerDirector';
import { WorkerEventTypes } from '../director/WorkerEventTypes';

const { UNCHAINED_WORKER_ID = os.hostname() } = process.env;

const buildQuerySelector = ({
  created = { start: null, end: null },
  selectTypes = [],
  status = [],
  workQueueId,
  ...rest
}: Query & {
  created?: { end?: Date; start?: Date };
  selectTypes?: Array<string>;
  status?: Array<WorkStatus>;
  workQueueId?: string;
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

  let query: Filter<WorkQueue> = statusQuery.$or.length > 0 ? statusQuery : {};

  query.$and = [
    selectTypes?.length > 0 && { type: { $in: selectTypes } },
    created?.end
      ? { created: { $gte: created.start, $lte: created.end } }
      : { created: { $gte: created?.start || new Date(0) } },
  ].filter(Boolean);

  if (workQueueId) {
    query = generateDbFilterById(workQueueId, query);
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
}: ModuleInput): Promise<WorkerModule> => {
  const WorkQueues = await WorkQueuesCollection(db);

  const mutations = generateDbMutations<WorkQueue>(
    WorkQueues,
    WorkQueuesSchema
  ) as ModuleMutations<WorkQueue>;

  const finishWork: WorkerModule['finishWork'] = async (
    workQueueId,
    { error, finished, result, started, success, worker = UNCHAINED_WORKER_ID },
    userId
  ) => {
    const workBeforeUpdate = await WorkQueues.findOne(
      buildQuerySelector({ workQueueId, status: [WorkStatus.ALLOCATED] })
    );
    if (!workBeforeUpdate) return null;

    await mutations.update(
      workQueueId,
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

    const work = await WorkQueues.findOne(generateDbFilterById(workQueueId));

    log(`Finished work ${workQueueId}`, {
      level: LogLevel.Verbose,
      work,
    });

    WorkerDirector.emit(WorkerEventTypes.FINISHED, { work });

    return work;
  };

  return {
    // Queries
    activeWorkTypes: async () => {
      const typeList = await WorkQueues.aggregate([
        { $group: { _id: '$type' } },
      ]).toArray();
      return typeList.map((t) => t._id);
    },

    findWorkQueue: async ({ workQueueId, originalWorkId }, options) => {
      return await WorkQueues.findOne(
        workQueueId ? generateDbFilterById(workQueueId) : { originalWorkId },
        options
      );
    },

    findWorkQueues: async ({ limit, skip, ...selectorOptions }) => {
      const workQueues = WorkQueues.find(buildQuerySelector(selectorOptions), {
        skip,
        limit,
        sort: defaultSort,
      });

      return await workQueues.toArray();
    },

    workQueueExists: async ({ workQueueId, originalWorkId }) => {
      const queueCount = await WorkQueues.find(
        workQueueId ? generateDbFilterById(workQueueId) : { originalWorkId },
        { limit: 1 }
      ).count();
      return !!queueCount;
    },

    // Transformations
    status: (workQueue) => {
      if (workQueue.deleted) {
        return WorkStatus.DELETED;
      }
      if (!workQueue.started && !workQueue.finished) {
        return WorkStatus.NEW;
      }
      if (workQueue.started && !workQueue.finished) {
        return WorkStatus.ALLOCATED;
      }
      if (workQueue.started && workQueue.finished && workQueue.success) {
        return WorkStatus.SUCCESS;
      }
      if (workQueue.started && workQueue.finished && !workQueue.success) {
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
      if (!WorkerDirector.getPlugin(type)) {
        throw new Error(`No plugin registered for type ${type}`);
      }

      const created = new Date();
      const workQueueId = await mutations.create(
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
        `WorkerDirector -> Work added ${workQueueId} (${type} / ${
          scheduled || created
        } / ${retries})`,
        { userId }
      );

      const work = await WorkQueues.findOne(generateDbFilterById(workQueueId));

      WorkerDirector.emit(WorkerEventTypes.ADDED, { work });

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
      (WorkQueues.findOneAndUpdate(
        query,
        {
          $set: { started: new Date(), worker },
        },
        { sort: defaultSort, returnNewDocument: true }
      ) as Promise<ModifyResult<WorkQueue>>);

      WorkerDirector.emit(WorkerEventTypes.ALLOCATED, { work: result.value });

      return result.value;
    },

    ensureOneWork: async (
      { type, input, priority = 0, scheduled, originalWorkId, retries = 20 },
      userId
    ) => {
      const created = new Date();
      const query = buildQuerySelector({
        type,
        status: [WorkStatus.NEW],
      });
      try {
        const workId = `${type}:${scheduled.getTime()}`;
        const result = await /* @ts-ignore */
        (WorkQueues.findOneAndUpdate(
          query,
          {
            $set: {
              input,
              priority,
              worker: null,
              updated: created,
              updatedBy: userId,
            },
            $setOnInsert: {
              _id: workId,
              type,
              originalWorkId,
              scheduled,
              retries,
              created,
              createdBy: userId,
            },
          },
          {
            sort: defaultSort,
            returnNewDocument: true,
            upsert: true,
          }
        ) as Promise<ModifyResult<WorkQueue>>);

        if (!result.lastErrorObject.updatedExisting) {
          log(
            `WorkerDirector -> Work added again (ensure) ${type} ${scheduled} ${retries}`
          );

          WorkerDirector.emit(WorkerEventTypes.ADDED, { work: result.value });
        }
        return result.value;
      } catch (e) {
        return null;
      }
    },

    finishWork,

    deleteWork: async (workQueueId, userId) => {
      const workBeforeRemoval = await WorkQueues.findOne(
        buildQuerySelector({
          workQueueId,
          status: [WorkStatus.NEW, WorkStatus.ALLOCATED],
        })
      );
      if (!workBeforeRemoval) return null;

      await mutations.delete(workQueueId, userId);

      const work = await WorkQueues.findOne(generateDbFilterById(workQueueId));

      WorkerDirector.emit(WorkerEventTypes.DELETED, { work });

      return work;
    },

    markOldWorkAsFailed: async ({ types, worker, referenceDate }, userId) => {
      const workQueues = await WorkQueues.find(
        buildQuerySelector({
          status: [WorkStatus.ALLOCATED],
          started: { $lte: referenceDate },
          worker,
          type: { $in: types },
        }),
        { type: 1, sort: { test: 1 } } as Projection<WorkQueue>
      ).toArray();

      return Promise.all(
        workQueues.map(
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

    /* create: async (doc, userId) => {
      const Adapter = getWorkerAdapter(doc);
      if (!Adapter) return null;

      const workQueueId = await mutations.create(
        { configuration: [], ...doc },
        userId
      );

      const workQueue = await WorkQueues.findOne(
        generateDbFilterById(workQueueId)
      );
      emit('WORK_QUEUE_CREATE', { workQueue });
      return workQueueId;
    },

    update: async (_id: string, doc: WorkQueue, userId: string) => {
      const workQueueId = await mutations.update(_id, doc, userId);
      const workQueue = await WorkQueues.findOne(generateDbFilterById(_id));
      emit('WORK_QUEUE_UPDATE', { workQueue });

      return workQueueId;
    },

    delete: async (_id, userId) => {
      const deletedCount = await mutations.delete(_id, userId);
      const workQueue = WorkQueues.findOne(generateDbFilterById(_id));

      emit('WORK_QUEUE_REMOVE', { workQueue });
      return deletedCount;
    },*/
  };
};
