import { z } from 'zod/v4-mini';
import {
  PaginationSchema,
  SortingSchema,
  SearchSchema,
  DateRangeSchema,
  createManagementSchemaFromValidators,
} from '../../utils/sharedSchemas.ts';
import { WorkStatus } from '@unchainedshop/core-worker';

export const WorkStatusKeys = Object.keys(WorkStatus) as [string, ...string[]];
export const ActiveWorkTypesSchema = z.object({});

export const actionValidators = {
  SHOP_INFO: z
    .object({})
    .check(
      z.describe(
        'Get shop configuration including default locale settings. No parameters expected - returns system-wide defaults.',
      ),
    ),

  WORKER_ADD: z.object({
    type: z
      .string()
      .check(
        z.minLength(1),
        z.describe(
          'Work type key that determines which worker/handler will process the job. Must match a registered worker type in the system.',
        ),
      ),
    priority: z
      ._default(z.int(), 0)
      .check(
        z.describe(
          'Job priority for queue ordering. Higher values are processed first. Default is 0. Negative values allowed for lower priority.',
        ),
      ),
    input: z
      .optional(z.any())
      .check(
        z.describe(
          'Arbitrary JSON payload passed to the worker. The structure depends on the work type and should be validated by the worker implementation.',
        ),
      ),
    originalWorkId: z
      .optional(z.string())
      .check(
        z.describe(
          'Reference to the original work item ID. Useful for tracking retries, parent-child relationships, or audit trails.',
        ),
      ),
    scheduled: z
      .optional(z.iso.datetime())
      .check(
        z.describe(
          'ISO 8601 timestamp when the job should be executed. If omitted, the job is immediately available for processing.',
        ),
      ),
    retries: z
      ._default(z.int().check(z.gte(0), z.lte(1000)), 20)
      .check(z.describe('Maximum number of retry attempts allowed for this job. Default: 20.')),
    worker: z
      .optional(z.string())
      .check(
        z.describe(
          'Specific worker identifier to assign this job to. If provided, only that worker can process this job.',
        ),
      ),
  }),

  WORKER_ACTIVE_WORK_TYPES: ActiveWorkTypesSchema.check(
    z.describe(
      'Current active work types in the system. This includes all registered worker types that can process jobs. The list is dynamically generated based on the workers currently available. No parameters expected.',
    ),
  ),

  WORKER_ALLOCATE: z.object({
    types: z
      .optional(z.array(z.string()).check(z.minLength(1)))
      .check(
        z.describe(
          'Must match a registered worker type in the system,  When provided, the worker will take precedence in the queue and be allocated',
        ),
      ),
    worker: z
      .optional(z.string())
      .check(
        z.describe(
          'Worker identifier that will process the allocated task. Used for tracking and locking the work item to this worker.',
        ),
      ),
  }),

  WORKER_REMOVE: z.object({
    workId: z
      .string()
      .check(
        z.describe(
          'Unique identifier of the work item to remove from the queue. only NEW worker that is not deleted, allocated or finished',
        ),
      ),
  }),

  WORKER_GET: z.object({
    workId: z
      .string()
      .check(z.minLength(1), z.describe('Unique identifier of the work item to retrieve')),
  }),

  WORKER_LIST: z.object({
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
    created: z
      .optional(z.object(DateRangeSchema))
      .check(z.describe('Date range filter for when work items were created')),
    status: z
      .optional(z.array(z.enum(WorkStatusKeys)))
      .check(z.describe('Filter by work item status (NEW, ALLOCATED, SUCCESS, FAILED, DELETED)')),
    types: z.optional(z.array(z.string())).check(z.describe('Filter by specific work types')),
  }),

  WORKER_COUNT: z.object({
    ...SearchSchema,
    created: z
      .optional(z.object(DateRangeSchema))
      .check(z.describe('Date range filter for when work items were created')),
    status: z
      .optional(z.array(z.enum(WorkStatusKeys)))
      .check(z.describe('Filter by work item status (NEW, ALLOCATED, SUCCESS, FAILED, DELETED)')),
    types: z.optional(z.array(z.string())).check(z.describe('Filter by specific work types')),
  }),

  WORKER_FINISH_WORK: z.object({
    workId: z.string().check(z.describe('Unique identifier of the work item to mark as completed.')),
    result: z
      .optional(z.any())
      .check(
        z.describe('JSON result data produced by the work execution. Can be any valid JSON value.'),
      ),
    error: z
      .optional(z.any())
      .check(
        z.describe(
          'Error information if the work failed. Can be an error message, stack trace, or error object.',
        ),
      ),
    success: z
      .boolean()
      .check(z.describe('Whether the work completed successfully. Required to mark work as finished.')),
    worker: z
      .optional(z.string())
      .check(
        z.describe(
          'Identifier of the worker that completed the task. Used for logging and tracking purposes.',
        ),
      ),
    started: z
      .optional(z.iso.datetime())
      .check(z.describe('ISO 8601 timestamp when the worker began executing this work item.')),
    finished: z
      .optional(z.iso.datetime())
      .check(z.describe('ISO 8601 timestamp when the work execution completed (success or failure).')),
  }),

  WORKER_PROCESS_NEXT: z.object({
    worker: z
      .optional(z.string())
      .check(
        z.describe(
          'Worker identifier for task allocation. If provided, assigns the next available task to this specific worker.',
        ),
      ),
  }),

  WORKER_STATISTICS: z.object({
    types: z.optional(z.array(z.string())).check(z.describe('Filter statistics by specific work types')),
    dateRange: z
      .optional(z.object(DateRangeSchema))
      .check(z.describe('Date range to filter work statistics')),
  }),

  EVENT_GET: z.object({
    eventId: z
      .string()
      .check(
        z.minLength(1),
        z.describe('Unique identifier of the event to retrieve from the event history'),
      ),
  }),

  EVENT_LIST: z.object({
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
    types: z
      .optional(z.array(z.string()))
      .check(z.describe('Filter events by specific event types (e.g., USER_CREATED, ORDER_PLACED)')),
    created: z
      .optional(z.object(DateRangeSchema))
      .check(z.describe('Date range filter for when events are emitted/created')),
  }),

  EVENT_COUNT: z.object({
    ...SearchSchema,
    types: z
      .optional(z.array(z.string()))
      .check(z.describe('Filter events by specific event types (e.g., USER_CREATED, ORDER_PLACED)')),
    created: z
      .optional(z.object(DateRangeSchema))
      .check(z.describe('Date range filter for when events are emitted/created')),
  }),

  EVENT_STATISTICS: z.object({
    types: z
      .optional(z.array(z.string()))
      .check(
        z.describe(
          'Filter statistics by specific event types. If not provided, includes all event types',
        ),
      ),
    dateRange: z
      .optional(z.object(DateRangeSchema))
      .check(z.describe('Date range to filter event statistics. Includes start and/or end dates')),
  }),
} as const;

export const SystemManagementSchema = createManagementSchemaFromValidators(actionValidators);

export type { ManagementParams as SystemManagementParams } from '../../utils/sharedSchemas.ts';

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (modules: any, params: Params<T>) => Promise<unknown>;
