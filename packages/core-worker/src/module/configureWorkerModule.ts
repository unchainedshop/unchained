import os from 'node:os';
import { createLogger } from '@unchainedshop/logger';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  buildObfuscatedFieldsFilter,
  type DateFilterInput,
  SortDirection,
  type SortOption,
} from '@unchainedshop/utils';
import {
  generateId,
  eq,
  and,
  or,
  inArray,
  isNull,
  isNotNull,
  gte,
  lte,
  asc,
  desc,
  sql,
  type DrizzleDb,
  type SQL,
} from '@unchainedshop/store';
import { workQueue, WorkStatus, type Work } from '../db/index.ts';
import { searchWorkQueueFTS } from '../db/fts.ts';

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
  error?: Record<string, unknown> | null;
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

// Sortable columns mapping
const SORTABLE_COLUMNS = {
  _id: workQueue._id,
  priority: workQueue.priority,
  scheduled: workQueue.scheduled,
  type: workQueue.type,
  started: workQueue.started,
  finished: workQueue.finished,
  originalWorkId: workQueue.originalWorkId,
  created: workQueue.created,
  updated: workQueue.updated,
} as const;

const buildSortOptions = (sort: SortOption[] = []) => {
  return sort.map((option) => {
    const column = SORTABLE_COLUMNS[option.key as keyof typeof SORTABLE_COLUMNS];
    if (!column) return asc(workQueue.created);
    return option.value === SortDirection.DESC ? desc(column) : asc(column);
  });
};

const defaultSort: { key: string; value: SortDirection }[] = [
  { key: 'started', value: SortDirection.DESC },
  { key: 'priority', value: SortDirection.DESC },
  { key: 'originalWorkId', value: SortDirection.ASC },
  { key: 'created', value: SortDirection.ASC },
];

// Build status conditions for Drizzle
const buildStatusCondition = (status: WorkStatus): SQL => {
  switch (status) {
    case WorkStatus.DELETED:
      return isNotNull(workQueue.deleted);
    case WorkStatus.NEW:
      return and(isNull(workQueue.started), isNull(workQueue.deleted))!;
    case WorkStatus.ALLOCATED:
      return and(isNotNull(workQueue.started), isNull(workQueue.finished), isNull(workQueue.deleted))!;
    case WorkStatus.SUCCESS:
      return and(isNotNull(workQueue.finished), eq(workQueue.success, true), isNull(workQueue.deleted))!;
    case WorkStatus.FAILED:
      return and(
        isNotNull(workQueue.finished),
        eq(workQueue.success, false),
        isNull(workQueue.deleted),
      )!;
    default:
      return isNull(workQueue.deleted);
  }
};

interface QuerySelectorOptions {
  created?: { end?: Date; start?: Date };
  scheduled?: { end?: Date; start?: Date };
  status?: WorkStatus[];
  workId?: string;
  queryString?: string;
  types?: string[];
  worker?: string | null | string[];
  type?: string;
  priority?: number;
  autoscheduled?: boolean;
  scheduleId?: string | null;
  started?: Date | { $lte: Date };
}

const buildQueryConditions = async (
  db: DrizzleDb,
  {
    created,
    scheduled,
    types,
    status,
    workId,
    queryString,
    worker,
    type,
    priority,
    autoscheduled,
    scheduleId,
    started,
  }: QuerySelectorOptions,
): Promise<SQL[]> => {
  const conditions: SQL[] = [];

  // Status conditions
  if (status?.length) {
    const statusConditions = status.map(buildStatusCondition);
    if (statusConditions.length === 1) {
      conditions.push(statusConditions[0]);
    } else {
      conditions.push(or(...statusConditions)!);
    }
  } else {
    // Default: exclude deleted
    conditions.push(isNull(workQueue.deleted));
  }

  // Date range filters
  if (created) {
    if (created.start) {
      conditions.push(gte(workQueue.created, created.start));
    }
    if (created.end) {
      conditions.push(lte(workQueue.created, created.end));
    }
  }

  if (scheduled) {
    if (scheduled.start) {
      conditions.push(gte(workQueue.scheduled, scheduled.start));
    }
    if (scheduled.end) {
      conditions.push(lte(workQueue.scheduled, scheduled.end));
    }
  }

  // Type filters
  if (types?.length) {
    conditions.push(inArray(workQueue.type, types));
  }
  if (type) {
    conditions.push(eq(workQueue.type, type));
  }

  // Work ID filter
  if (workId) {
    conditions.push(eq(workQueue._id, workId));
  }

  // Worker filter (can be null, empty string, or specific value)
  if (worker !== undefined) {
    if (Array.isArray(worker)) {
      // Handle $in style: worker can be null, '', or specific value
      const workerConditions: SQL[] = [];
      if (worker.includes(null as unknown as string) || worker.includes('')) {
        workerConditions.push(or(isNull(workQueue.worker), eq(workQueue.worker, ''))!);
      }
      const specificWorkers = worker.filter((w) => w !== null && w !== '');
      if (specificWorkers.length > 0) {
        workerConditions.push(inArray(workQueue.worker, specificWorkers));
      }
      if (workerConditions.length > 0) {
        conditions.push(or(...workerConditions)!);
      }
    } else if (worker === null) {
      conditions.push(isNull(workQueue.worker));
    } else {
      conditions.push(eq(workQueue.worker, worker));
    }
  }

  // Priority filter
  if (priority !== undefined) {
    conditions.push(eq(workQueue.priority, priority));
  }

  // Autoscheduled filter
  if (autoscheduled !== undefined) {
    conditions.push(eq(workQueue.autoscheduled, autoscheduled));
  }

  // Schedule ID filter
  if (scheduleId) {
    conditions.push(eq(workQueue.scheduleId, scheduleId));
  }

  // Started filter (for markOldWorkAsFailed)
  if (started) {
    if (started instanceof Date) {
      conditions.push(lte(workQueue.started, started));
    } else if ('$lte' in started) {
      conditions.push(lte(workQueue.started, started.$lte));
    }
  }

  // Full-text search
  if (queryString) {
    const matchingIds = await searchWorkQueueFTS(db, queryString);
    // Drizzle handles empty arrays natively - inArray with [] returns false
    conditions.push(inArray(workQueue._id, matchingIds));
  }

  return conditions;
};

const normalizeWorkQueueAggregateResult = (
  data: { type: string; status: string; count: number }[] = [],
): WorkerReport[] => {
  const statusToFieldMap: Record<string, keyof Omit<WorkerReport, 'type'>> = {
    NEW: 'newCount',
    ALLOCATED: 'startCount',
    FAILED: 'errorCount',
    SUCCESS: 'successCount',
    DELETED: 'deleteCount',
  };

  // Group by type
  const byType = new Map<string, WorkerReport>();

  for (const row of data) {
    if (!byType.has(row.type)) {
      byType.set(row.type, {
        type: row.type,
        newCount: 0,
        errorCount: 0,
        successCount: 0,
        startCount: 0,
        deleteCount: 0,
      });
    }
    const report = byType.get(row.type)!;
    const field = statusToFieldMap[row.status];
    if (field) {
      report[field] = row.count;
    }
  }

  // Normalize counts (cumulative)
  return Array.from(byType.values()).map((report) => {
    const { errorCount, successCount, deleteCount } = report;
    report.startCount += errorCount + successCount + deleteCount;
    report.newCount += report.startCount;
    return report;
  });
};

export const configureWorkerModule = async ({
  db,
  options,
}: {
  db: DrizzleDb;
  options?: WorkerSettingsOptions;
}) => {
  registerEvents(Object.values(WorkerEventTypes));

  const removePrivateFields = buildObfuscatedFieldsFilter(options?.blacklistedVariables);

  const allocateWork = async ({
    types,
    worker = UNCHAINED_WORKER_ID,
  }: {
    types: string[];
    worker: string;
  }) => {
    // If types is explicitly an empty array, no work can match
    if (types && types.length === 0) {
      return null;
    }

    // Find a work item that is scheduled for now and is not started
    const conditions = await buildQueryConditions(db, {
      status: [WorkStatus.NEW],
      scheduled: { end: new Date() },
      worker: [null as unknown as string, '', worker],
      ...(types?.length ? { types } : {}),
    });

    const sortOptions = buildSortOptions(defaultSort);

    // Find one matching work
    let queryBuilder = db.select().from(workQueue);
    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions)) as typeof queryBuilder;
    }
    queryBuilder = queryBuilder.orderBy(...sortOptions).limit(1) as typeof queryBuilder;

    const [work] = await queryBuilder;
    if (!work) return null;

    // Update it to mark as started
    const now = new Date();
    await db
      .update(workQueue)
      .set({
        started: now,
        worker,
        updated: now,
      })
      .where(eq(workQueue._id, work._id));

    // Fetch updated work
    const [updatedWork] = await db.select().from(workQueue).where(eq(workQueue._id, work._id)).limit(1);

    if (!updatedWork) return null;
    emit(WorkerEventTypes.ALLOCATED, removePrivateFields(updatedWork));
    return updatedWork;
  };

  const finishWork = async (
    workId: string,
    {
      error,
      finished = new Date(),
      result,
      started,
      success,
      worker = UNCHAINED_WORKER_ID,
    }: WorkResult<unknown> & {
      finished?: Date;
      started?: Date | null;
      worker?: string;
    },
  ) => {
    // Find existing work that's allocated
    const conditions = await buildQueryConditions(db, {
      workId,
      status: [WorkStatus.ALLOCATED],
    });

    const [workBeforeUpdate] = await db
      .select()
      .from(workQueue)
      .where(and(...conditions))
      .limit(1);

    if (!workBeforeUpdate) return null;

    const now = new Date();
    await db
      .update(workQueue)
      .set({
        updated: now,
        finished,
        success,
        error,
        result,
        ...(!workBeforeUpdate.started ? { started } : {}),
        worker,
      })
      .where(eq(workQueue._id, workId));

    const [work] = await db.select().from(workQueue).where(eq(workQueue._id, workId)).limit(1);

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
      const typeList = await db.selectDistinct({ type: workQueue.type }).from(workQueue);
      return typeList.map((t) => t.type);
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
        const [work] = await db
          .select()
          .from(workQueue)
          .where(eq(workQueue._id, params.workId))
          .limit(1);
        return work || null;
      }
      const [work] = await db
        .select()
        .from(workQueue)
        .where(eq(workQueue.originalWorkId, params.originalWorkId))
        .limit(1);
      return work || null;
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
      const conditions = await buildQueryConditions(db, selectorOptions);
      const sortOptions = buildSortOptions(sort || defaultSort);

      let queryBuilder = db.select().from(workQueue);

      if (conditions.length > 0) {
        queryBuilder = queryBuilder.where(and(...conditions)) as typeof queryBuilder;
      }

      if (sortOptions.length > 0) {
        queryBuilder = queryBuilder.orderBy(...sortOptions) as typeof queryBuilder;
      }

      if (skip !== undefined && skip > 0) {
        queryBuilder = queryBuilder.offset(skip) as typeof queryBuilder;
      }

      if (limit !== undefined && limit > 0) {
        queryBuilder = queryBuilder.limit(limit) as typeof queryBuilder;
      }

      return queryBuilder;
    },

    count: async (query: WorkQueueQuery) => {
      const conditions = await buildQueryConditions(db, query);

      let queryBuilder = db.select().from(workQueue);

      if (conditions.length > 0) {
        queryBuilder = queryBuilder.where(and(...conditions)) as typeof queryBuilder;
      }

      const result = await queryBuilder;
      return result.length;
    },

    allocationMap: async (): Promise<Record<string, number>> => {
      // Find allocated (started but not finished, not deleted) work grouped by type
      const results = await db.all<{ type: string; count: number }>(sql`
        SELECT type, COUNT(*) as count
        FROM work_queue
        WHERE started IS NOT NULL
          AND finished IS NULL
          AND deleted IS NULL
        GROUP BY type
      `);

      const allocationMap: Record<string, number> = {};
      for (const row of results) {
        allocationMap[row.type] = row.count;
      }
      return allocationMap;
    },

    workExists: async ({
      workId,
      originalWorkId,
    }: {
      workId?: string;
      originalWorkId?: string;
    }): Promise<boolean> => {
      let condition: SQL;
      if (workId) {
        condition = eq(workQueue._id, workId);
      } else if (originalWorkId) {
        condition = eq(workQueue.originalWorkId, originalWorkId);
      } else {
        return false;
      }

      const [result] = await db.select().from(workQueue).where(condition).limit(1);
      return !!result;
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
    }: Pick<Work, 'type'> &
      Pick<
        Partial<Work>,
        'scheduled' | 'priority' | 'input' | 'retries' | 'originalWorkId' | 'worker'
      >): Promise<Work> {
      const created = new Date();
      const workId = generateId();

      await db.insert(workQueue).values({
        _id: workId,
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

      const [work] = await db.select().from(workQueue).where(eq(workQueue._id, workId)).limit(1);
      emit(WorkerEventTypes.ADDED, removePrivateFields(work));

      return work;
    },

    async addWorkIfNotExists(
      workData: Pick<Work, 'type'> & Pick<Partial<Work>, 'scheduled' | 'priority' | 'input' | 'retries'>,
      existenceCheck: (work: Work) => boolean,
    ): Promise<Work | null> {
      const conditions = await buildQueryConditions(db, {
        types: [workData.type],
        status: [WorkStatus.NEW, WorkStatus.ALLOCATED],
      });

      const workItems = await db
        .select()
        .from(workQueue)
        .where(and(...conditions));

      const existingWork = workItems.find(existenceCheck);
      if (existingWork) return null;

      return this.addWork(workData);
    },

    rescheduleWork: async (currentWork: Work, scheduled: Date) => {
      const now = new Date();
      await db
        .update(workQueue)
        .set({
          updated: now,
          scheduled,
        })
        .where(eq(workQueue._id, currentWork._id));

      const [work] = await db
        .select()
        .from(workQueue)
        .where(eq(workQueue._id, currentWork._id))
        .limit(1);

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
      const conditions = await buildQueryConditions(db, {
        type,
        status: [WorkStatus.NEW],
        priority,
        autoscheduled: true,
        scheduleId,
      });

      await db
        .update(workQueue)
        .set({
          deleted: new Date(),
        })
        .where(and(...conditions));
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

      // Try to find existing NEW work with same type, priority, scheduleId
      const conditions = await buildQueryConditions(db, {
        type,
        status: [WorkStatus.NEW],
        priority,
        autoscheduled: true,
        scheduleId,
      });

      const sortOptions = buildSortOptions(defaultSort);

      const [existingWork] = await db
        .select()
        .from(workQueue)
        .where(and(...conditions))
        .orderBy(...sortOptions)
        .limit(1);

      if (existingWork) {
        // Update existing work
        await db
          .update(workQueue)
          .set({
            input,
            worker: null,
            updated: created,
            retries,
            timeout,
            originalWorkId,
            deleted: null, // Unset deleted
          })
          .where(eq(workQueue._id, existingWork._id));

        const [updatedWork] = await db
          .select()
          .from(workQueue)
          .where(eq(workQueue._id, existingWork._id))
          .limit(1);

        return updatedWork;
      }

      // Try to insert new work
      try {
        await db.insert(workQueue).values({
          _id: workId,
          scheduleId,
          scheduled,
          type,
          created,
          autoscheduled: true,
          priority,
          input,
          worker: null,
          retries,
          timeout,
          originalWorkId,
        });

        logger.debug(`${type} auto-scheduled @ ${new Date(scheduled).toISOString()}`, {
          workId,
        });

        const [newWork] = await db.select().from(workQueue).where(eq(workQueue._id, workId)).limit(1);
        emit(WorkerEventTypes.ADDED, removePrivateFields(newWork));
        return newWork;
      } catch {
        // Conflicting work problem - return null and let scheduler retry
        return null;
      }
    },

    finishWork,

    deleteWork: async (workId: string) => {
      const conditions = await buildQueryConditions(db, {
        workId,
        status: [WorkStatus.NEW, WorkStatus.ALLOCATED],
      });

      const [workBeforeRemoval] = await db
        .select()
        .from(workQueue)
        .where(and(...conditions))
        .limit(1);

      if (!workBeforeRemoval) return null;

      await db
        .update(workQueue)
        .set({
          deleted: new Date(),
        })
        .where(eq(workQueue._id, workId));

      const [work] = await db.select().from(workQueue).where(eq(workQueue._id, workId)).limit(1);

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
      // Find allocated work started before referenceDate for this worker
      const conditions = await buildQueryConditions(db, {
        status: [WorkStatus.ALLOCATED],
        started: { $lte: referenceDate },
        worker: [worker, '', null as unknown as string],
        types,
      });

      const workItems = await db
        .select({ _id: workQueue._id })
        .from(workQueue)
        .where(and(...conditions));

      const results = await Promise.all(
        workItems.map(({ _id }) =>
          finishWork(_id, {
            finished: new Date(),
            result: undefined,
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

      return results.filter(Boolean) as Work[];
    },

    getReport: async ({
      types,
      dateRange,
    }: {
      types?: string[];
      dateRange?: DateFilterInput;
    }): Promise<WorkerReport[]> => {
      // Build WHERE conditions using drizzle's sql template
      const conditions: SQL[] = [];

      if (dateRange?.start) {
        const fromTime = new Date(dateRange.start).getTime();
        conditions.push(sql`(created >= ${fromTime} OR updated >= ${fromTime})`);
      }
      if (dateRange?.end) {
        const toTime = new Date(dateRange.end).getTime();
        conditions.push(sql`(created <= ${toTime} OR updated <= ${toTime})`);
      }

      if (types?.length) {
        conditions.push(inArray(workQueue.type, types));
      }

      const whereClause = conditions.length > 0 ? sql`WHERE ${and(...conditions)}` : sql``;

      // Calculate status using CASE WHEN
      const results = await db.all<{ type: string; status: string; count: number }>(sql`
        SELECT
          type,
          CASE
            WHEN deleted IS NOT NULL THEN 'DELETED'
            WHEN started IS NULL AND deleted IS NULL THEN 'NEW'
            WHEN started IS NOT NULL AND finished IS NULL AND deleted IS NULL THEN 'ALLOCATED'
            WHEN finished IS NOT NULL AND success = 1 AND deleted IS NULL THEN 'SUCCESS'
            WHEN finished IS NOT NULL AND success = 0 AND deleted IS NULL THEN 'FAILED'
            ELSE 'UNKNOWN'
          END as status,
          COUNT(*) as count
        FROM work_queue
        ${whereClause}
        GROUP BY type, status
      `);

      return normalizeWorkQueueAggregateResult(results);
    },
  };
};

export type WorkerModule = Awaited<ReturnType<typeof configureWorkerModule>>;
