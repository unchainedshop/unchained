import os from 'node:os';
import { createLogger } from '@unchainedshop/logger';
import {
  generateDbFilterById,
  buildSortOptions,
  type mongodb,
  generateDbObjectId,
  type ModuleInput,
  assertDocumentDBCompatMode,
} from '@unchainedshop/mongodb';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  buildObfuscatedFieldsFilter,
  type DateFilterInput,
  SortDirection,
  type SortOption,
} from '@unchainedshop/utils';
import { type Work, WorkQueueCollection, WorkStatus } from '../db/WorkQueueCollection.ts';

const { UNCHAINED_WORKER_ID = os.hostname() } = process.env;

export const DIRECTOR_MARKED_FAILED_ERROR = 'DIRECTOR_MARKED_FAILED';

const logger = createLogger('unchained:core-worker');

export type WorkData = Pick<
  Partial<Work>,
  'input' | 'originalWorkId' | 'priority' | 'retries' | 'timeout' | 'worker' | 'scheduleId'
> &
  Pick<Work, 'type' | 'scheduled'>;

export interface WorkResult<Result = unknown> {
  success: boolean;
  result?: Result;
  error?: any;
}

export const WorkerEventTypes = {
  ADDED: 'WORK_ADDED',
  ALLOCATED: 'WORK_ALLOCATED',
  FINISHED: 'WORK_FINISHED',
  DELETED: 'WORK_DELETED',
  RESCHEDULED: 'WORK_RESCHEDULED',
} as const;

export type WorkerEventTypes = (typeof WorkerEventTypes)[keyof typeof WorkerEventTypes];

export interface WorkerSettingsOptions {
  blacklistedVariables?: string[];
}

export interface WorkerReport {
  type: string;
  newCount: number;
  errorCount: number;
  successCount: number;
  startCount: number;
  deleteCount: number;
}

export interface WorkQueueQuery {
  created?: { end?: Date; start?: Date };
  types?: string[];
  status?: WorkStatus[];
  queryString?: string;
  scheduled?: { end?: Date; start?: Date };
}

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
  status?: WorkStatus[];
  workId?: string;
  queryString?: string;
  types?: string[];
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
  if (queryString) {
    assertDocumentDBCompatMode();
    (query as any).$text = { $search: queryString };
  }

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

const defaultSort: { key: string; value: SortDirection }[] = [
  { key: 'started', value: SortDirection.DESC },
  { key: 'priority', value: SortDirection.DESC },
  { key: 'originalWorkId', value: SortDirection.ASC },
  { key: 'created', value: SortDirection.ASC },
];

const normalizeWorkQueueAggregateResult = (data: mongodb.Document[] = []): WorkerReport[] => {
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

export const configureWorkerModule = async ({ db, options }: ModuleInput<WorkerSettingsOptions>) => {
  registerEvents(Object.values(WorkerEventTypes));

  const WorkQueue = await WorkQueueCollection(db);

  const removePrivateFields = buildObfuscatedFieldsFilter(options?.blacklistedVariables);

  const allocateWork = async ({
    types,
    worker = UNCHAINED_WORKER_ID,
  }: {
    types: string[];
    worker: string;
  }) => {
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

    if (!result) return null;
    emit(WorkerEventTypes.ALLOCATED, removePrivateFields(result));
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
  ) => {
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

    if (!work) return null;

    const duration = new Date(work.finished!).getTime() - new Date(work.started!).getTime();
    if (work.success) {
      logger.debug(`${work.type} finished with success (${duration}ms)`, {
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

    activeWorkTypes: async (): Promise<string[]> => {
      const typeList = await WorkQueue.aggregate([{ $group: { _id: '$type' } }]).toArray();
      return typeList.map((t) => t._id as string);
    },

    findWork: async (
      params:
        | {
            workId: string;
          }
        | {
            originalWorkId: string;
          },
    ) => {
      if ('workId' in params) {
        return WorkQueue.findOne(generateDbFilterById(params.workId), {});
      }
      return WorkQueue.findOne({ originalWorkId: params.originalWorkId }, {});
    },

    findWorkQueue: async ({
      limit,
      skip,
      sort,
      ...selectorOptions
    }: WorkQueueQuery & {
      sort?: SortOption[];
      limit?: number;
      skip?: number;
    }): Promise<Work[]> => {
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
    async addWork({
      type,
      input,
      priority = 0,
      scheduled,
      originalWorkId,
      worker = null,
      retries = 20,
    }: Pick<Work, 'type' | 'originalWorkId' | 'worker'> &
      Pick<Partial<Work>, 'scheduled' | 'priority' | 'input' | 'retries'>): Promise<Work> {
      const created = new Date();
      const { insertedId: workId } = await WorkQueue.insertOne({
        _id: generateDbObjectId(),
        created,
        type,
        input: input || {},
        priority,
        scheduled: scheduled || created,
        originalWorkId,
        retries,
        worker,
      });

      logger.debug(`${type} scheduled @ ${new Date(scheduled || created).toISOString()}`, {
        workId,
      });

      const work = (await WorkQueue.findOne(generateDbFilterById(workId), {})) as Work;
      emit(WorkerEventTypes.ADDED, removePrivateFields(work));

      return work;
    },

    async addWorkIfNotExists(
      workData: Pick<Work, 'type'> & Pick<Partial<Work>, 'scheduled' | 'priority' | 'input' | 'retries'>,
      existenceCheck: (work: Work) => boolean,
    ): Promise<Work | null> {
      const workItems = await WorkQueue.find(
        buildQuerySelector({
          types: [workData.type],
          status: [WorkStatus.NEW, WorkStatus.ALLOCATED],
        }),
      ).toArray();

      const existingWork = workItems.find(existenceCheck);
      if (existingWork) return null;

      return this.addWork(workData);
    },

    rescheduleWork: async (currentWork: Work, scheduled: Date) => {
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

      if (!work) return null;
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
    }: WorkData) => {
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

        if (!result.lastErrorObject) {
          logger.debug(`${type} auto-scheduled @ ${new Date(scheduled).toISOString()}`, {
            workId,
          });
          emit(WorkerEventTypes.ADDED, removePrivateFields(result.value));
        }
        return result.value;
      } catch {
        /* Conflicting deleted work problem:
        If the findOneAndUpdate call failed because of _id conflict with a DELETED work,
        we should NOT permanently remove the conflicting deleted work 
        and retry the findOneAndUpdate call.
        If we did remove the deleted work, deleted jobs would "re-appear" as NEW with same schedule and _id.
        So we just return null here and let the scheduler try again in the next cycle.
        */
        return null;
      }
    },

    finishWork,

    deleteWork: async (workId: string) => {
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

      if (!work) return null;
      emit(WorkerEventTypes.DELETED, removePrivateFields(work));
      return work;
    },

    markOldWorkAsFailed: async ({
      types,
      worker = UNCHAINED_WORKER_ID,
      referenceDate,
    }: {
      types: string[];
      worker: string;
      referenceDate: Date;
    }): Promise<Work[]> => {
      const workQueue = await WorkQueue.find(
        buildQuerySelector({
          status: [WorkStatus.ALLOCATED],
          started: { $lte: referenceDate },
          worker: { $in: [worker, '', null] }, // Don't mark work failed of other workers!
          type: { $in: types },
        }),
        { projection: { _id: true }, sort: { test: 1 } },
      ).toArray();

      return (
        await Promise.all(
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
        )
      ).filter(Boolean) as Work[];
    },

    getReport: async ({
      types,
      dateRange,
    }: {
      types?: string[];
      dateRange?: DateFilterInput;
    }): Promise<WorkerReport[]> => {
      const pipeline: mongodb.BSON.Document[] = [];
      const matchConditions: any[] = [];
      // build date filter based on provided values it can be a range if both to and from is supplied
      // a upper or lowe limit if either from or to is provided
      // or all if none is provided
      if (dateRange?.start || dateRange?.end) {
        const dateConditions: any[] = [];
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
