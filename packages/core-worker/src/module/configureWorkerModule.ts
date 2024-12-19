import os from 'node:os';
import { createLogger } from '@unchainedshop/logger';
import {
  generateDbFilterById,
  buildSortOptions,
  mongodb,
  generateDbObjectId,
  ModuleInput,
} from '@unchainedshop/mongodb';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  buildObfuscatedFieldsFilter,
  DateFilterInput,
  SortDirection,
  SortOption,
} from '@unchainedshop/utils';
import { Work, WorkQueueCollection, WorkStatus } from '../db/WorkQueueCollection.js';
import addMigrations from './migrations/addMigrations.js';

const { UNCHAINED_WORKER_ID = os.hostname() } = process.env;

export const DIRECTOR_MARKED_FAILED_ERROR = 'DIRECTOR_MARKED_FAILED';

const logger = createLogger('unchained:core-worker');

export type WorkData = Pick<
  Partial<Work>,
  'input' | 'originalWorkId' | 'priority' | 'retries' | 'timeout' | 'scheduled' | 'worker' | 'scheduleId'
> & { type: string };

export interface WorkResult<Result = unknown> {
  success: boolean;
  result?: Result;
  error?: any;
}

export enum WorkerEventTypes {
  ADDED = 'WORK_ADDED',
  ALLOCATED = 'WORK_ALLOCATED',
  FINISHED = 'WORK_FINISHED',
  DELETED = 'WORK_DELETED',
  RESCHEDULED = 'WORK_RESCHEDULED',
}

export interface WorkerSettingsOptions {
  blacklistedVariables?: string[];
}

export type WorkerReport = {
  type: string;
  newCount: number;
  errorCount: number;
  successCount: number;
  startCount: number;
  deleteCount: number;
};

export type WorkQueueQuery = {
  created?: { end?: Date; start?: Date };
  types?: Array<string>;
  status: Array<WorkStatus>;
  queryString?: string;
  scheduled?: { end?: Date; start?: Date };
};

const WORK_STATUS_FILTER_MAP = {
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
  const statusQuery = {
    $or: Object.entries(WORK_STATUS_FILTER_MAP).reduce(
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

const convertFilterMapToPipelineBranches = () => {
  return Object.entries(WORK_STATUS_FILTER_MAP).map(([status, conditions]) => {
    const caseConditions = Object.entries(conditions).map(([field, condition]) => {
      if (typeof condition === 'object' && '$exists' in condition) {
        return condition.$exists
          ? { $ne: [{ $type: `$${field}` }, 'missing'] }
          : { $eq: [{ $type: `$${field}` }, 'missing'] };
      }
      return { $eq: [`$${field}`, condition] };
    });

    return {
      case: caseConditions.length > 1 ? { $and: caseConditions } : caseConditions[0],
      then: status,
    };
  });
};

const defaultSort: Array<{ key: string; value: SortDirection }> = [
  { key: 'started', value: SortDirection.DESC },
  { key: 'priority', value: SortDirection.DESC },
  { key: 'originalWorkId', value: SortDirection.ASC },
  { key: 'created', value: SortDirection.ASC },
];

const normalizeWorkQueueAggregateResult = (data = []): WorkerReport[] => {
  const statusToFieldMap = {
    NEW: 'newCount',
    ALLOCATED: 'startCount',
    FAILED: 'errorCount',
    SUCCESS: 'successCount',
    DELETED: 'deleteCount',
  };

  return data.map((item) => {
    const workStatistics: WorkerReport = {
      type: item.type,
      ...(Object.values(statusToFieldMap).reduce((acc, key) => ({ ...acc, [key]: 0 }), {}) as any),
    };

    item.statuses.forEach(({ status, count }) => {
      if (statusToFieldMap[status]) {
        workStatistics[statusToFieldMap[status]] = count;
      }
    });
    const { errorCount, successCount, deleteCount } = workStatistics;

    workStatistics.startCount += errorCount + successCount + deleteCount;
    workStatistics.newCount += workStatistics.startCount;

    return workStatistics;
  }) as unknown as WorkerReport[];
};

export const configureWorkerModule = async ({
  db,
  migrationRepository,
  options,
}: ModuleInput<WorkerSettingsOptions>) => {
  addMigrations(migrationRepository);

  registerEvents(Object.values(WorkerEventTypes));

  const WorkQueue = await WorkQueueCollection(db);

  const removePrivateFields = buildObfuscatedFieldsFilter(options?.blacklistedVariables);

  const allocateWork = async ({
    types,
    worker = UNCHAINED_WORKER_ID,
  }: {
    types: Array<string>;
    worker: string;
  }): Promise<Work> => {
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

  const finishWork = async (
    workId: string,
    {
      error,
      finished = new Date(),
      result,
      started = new Date(),
      success,
      worker = UNCHAINED_WORKER_ID,
    }: WorkResult<any> & {
      finished?: Date;
      started?: Date;
      worker?: string;
    },
  ): Promise<Work> => {
    const workBeforeUpdate = await WorkQueue.findOne(
      buildQuerySelector({ workId, status: [WorkStatus.ALLOCATED] }),
    );

    if (!workBeforeUpdate) return null;

    const work = await WorkQueue.findOneAndUpdate(
      generateDbFilterById(workId),
      {
        $set: {
          updated: new Date(),
          finished,
          success,
          error,
          result,
          ...(!workBeforeUpdate.started ? { started } : {}),
          worker,
        },
      },
      { returnDocument: 'after' },
    );

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

  return {
    // Queries

    workerId: UNCHAINED_WORKER_ID,

    activeWorkTypes: async (): Promise<Array<string>> => {
      const typeList = await WorkQueue.aggregate([{ $group: { _id: '$type' } }]).toArray();
      return typeList.map((t) => t._id as string);
    },

    findWork: async ({
      workId,
      originalWorkId,
    }: {
      workId?: string;
      originalWorkId?: string;
    }): Promise<Work> =>
      WorkQueue.findOne(workId ? generateDbFilterById(workId) : { originalWorkId }, {}),

    findWorkQueue: async ({
      limit,
      skip,
      sort,
      ...selectorOptions
    }: WorkQueueQuery & {
      sort?: Array<SortOption>;
      limit?: number;
      skip?: number;
    }): Promise<Array<Work>> => {
      const selector = buildQuerySelector(selectorOptions);
      return WorkQueue.find(selector, {
        skip,
        limit,
        sort: buildSortOptions(sort || defaultSort),
      }).toArray();
    },

    count: async (query: WorkQueueQuery) => {
      return WorkQueue.countDocuments(buildQuerySelector(query));
    },

    allocationMap: async (): Promise<Record<string, number>> => {
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
      return allocationMap;
    },

    workExists: async ({
      workId,
      originalWorkId,
    }: {
      workId?: string;
      originalWorkId?: string;
    }): Promise<boolean> => {
      const queueCount = await WorkQueue.countDocuments(
        workId ? generateDbFilterById(workId) : { originalWorkId },
        { limit: 1 },
      );
      return !!queueCount;
    },

    status: (work: Work): WorkStatus => {
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
    }: WorkData): Promise<Work> => {
      const created = new Date();
      const { insertedId: workId } = await WorkQueue.insertOne({
        _id: generateDbObjectId(),
        created,
        type,
        input,
        priority,
        scheduled: scheduled || created,
        originalWorkId,
        retries,
        worker,
      });

      logger.info(`${type} scheduled @ ${new Date(scheduled || created).toISOString()}`, {
        workId,
      });

      const work = await WorkQueue.findOne(generateDbFilterById(workId), {});
      emit(WorkerEventTypes.ADDED, removePrivateFields(work));

      return work;
    },

    rescheduleWork: async (currentWork: Work, scheduled: Date): Promise<Work> => {
      const work = await WorkQueue.findOneAndUpdate(
        generateDbFilterById(currentWork._id),
        {
          $set: {
            updated: new Date(),
            scheduled,
          },
        },
        { returnDocument: 'after' },
      );

      emit(WorkerEventTypes.RESCHEDULED, {
        work: removePrivateFields(work),
        oldScheduled: currentWork.scheduled,
      });

      return work;
    },

    allocateWork,

    ensureNoWork: async ({
      type,
      priority = 0,
      scheduleId,
    }: {
      priority: number;
      type: string;
      scheduleId: string;
    }): Promise<void> => {
      const query = buildQuerySelector({
        type,
        status: [WorkStatus.NEW],
        priority,
        autoscheduled: true,
        scheduleId,
      });

      await WorkQueue.updateMany(query, {
        $set: {
          deleted: new Date(),
        },
      });
    },

    ensureOneWork: async ({
      type,
      input,
      priority = 0,
      scheduled,
      timeout,
      originalWorkId,
      retries = 20,
      scheduleId,
    }: WorkData): Promise<Work> => {
      const workId = `${scheduleId}:${scheduled.getTime()}`;

      const created = new Date();
      const query = buildQuerySelector({
        type,
        status: [WorkStatus.NEW],
        priority,
        autoscheduled: true,
        scheduleId,
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
              scheduleId,
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
      } catch {
        /* TODO: 
        If the findOneAndUpdate call failed because of _id conflict with a DELETED work,
        we should permanently remove the conflicting deleted work 
        and retry the findOneAndUpdate call.
        */
        return null;
      }
    },

    finishWork,

    deleteWork: async (workId: string): Promise<Work> => {
      const workBeforeRemoval = await WorkQueue.findOne(
        buildQuerySelector({
          workId,
          status: [WorkStatus.NEW, WorkStatus.ALLOCATED],
        }),
      );
      if (!workBeforeRemoval) return null;

      const work = await WorkQueue.findOneAndUpdate(
        generateDbFilterById(workId),
        {
          $set: {
            deleted: new Date(),
          },
        },
        { returnDocument: 'after' },
      );

      emit(WorkerEventTypes.DELETED, removePrivateFields(work));

      return work;
    },

    markOldWorkAsFailed: async ({
      types,
      worker = UNCHAINED_WORKER_ID,
      referenceDate,
    }: {
      types: Array<string>;
      worker: string;
      referenceDate: Date;
    }): Promise<Array<Work>> => {
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

    getReport: async ({
      types,
      dateRange,
    }: {
      types?: Array<string>;
      dateRange?: DateFilterInput;
    }): Promise<WorkerReport[]> => {
      const pipeline = [];
      const matchConditions = [];
      // build date filter based on provided values it can be a range if both to and from is supplied
      // a upper or lowe limit if either from or to is provided
      // or all if none is provided
      if (dateRange?.start || dateRange?.end) {
        const dateConditions = [];
        if (dateRange?.start) {
          const fromDate = new Date(dateRange?.start);
          dateConditions.push({
            $or: [{ created: { $gte: fromDate } }, { updated: { $gte: fromDate } }],
          });
        }
        if (dateRange?.end) {
          const toDate = new Date(dateRange?.end);
          dateConditions.push({
            $or: [{ created: { $lte: toDate } }, { updated: { $lte: toDate } }],
          });
        }
        if (dateConditions.length > 0) {
          matchConditions.push({ $and: dateConditions });
        }
      }
      // build types filter if type is provided or ignore types if it is not provided
      if (types && Array.isArray(types) && types.length) {
        matchConditions.push({ type: { $in: types } });
      }
      if (matchConditions.length > 0) {
        pipeline.push({
          $match: {
            $and: matchConditions,
          },
        });
      }
      pipeline.push(
        {
          $addFields: {
            status: {
              $switch: {
                branches: convertFilterMapToPipelineBranches(),
                default: 'UNKNOWN',
              },
            },
          },
        },
        {
          $group: {
            _id: {
              type: '$type',
              status: '$status',
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.type',
            statuses: {
              $push: {
                status: '$_id.status',
                count: '$count',
              },
            },
          },
        },

        {
          $project: {
            _id: 0,
            type: '$_id',
            statuses: 1,
          },
        },
      );

      return normalizeWorkQueueAggregateResult(await WorkQueue.aggregate(pipeline).toArray()) as any;
    },
  };
};

export type WorkerModule = Awaited<ReturnType<typeof configureWorkerModule>>;
