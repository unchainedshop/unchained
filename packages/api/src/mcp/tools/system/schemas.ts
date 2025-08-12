import { z } from 'zod';
import {
  PaginationSchema,
  SortingSchema,
  SearchSchema,
  DateRangeSchema,
} from '../../utils/sharedSchemas.js';
import { WorkStatus } from '@unchainedshop/core-worker';

export const WorkStatusKeys = Object.keys(WorkStatus) as [string, ...string[]];
export const ActiveWorkTypesSchema = z.object({});

export const actionValidators = {
  SHOP_INFO: z
    .object({})
    .describe(
      'MANDATORY FIRST CALL when locale/language/country/currency defaults are needed. Get the authoritative shop configuration including defaultLanguageIsoCode (for language/locale fallback), country_isoCode (for country fallback), and country_defaultCurrency (for currency fallback). No parameters expected - returns system-wide defaults that must be used when user input lacks localization context.',
    ),

  WORKER_ADD: z.object({
    type: z
      .string()
      .min(1)
      .describe(
        'Work type key that determines which worker/handler will process the job. Must match a registered worker type in the system.',
      ),
    priority: z
      .number()
      .int()
      .default(0)
      .describe(
        'Job priority for queue ordering. Higher values are processed first. Default is 0. Negative values allowed for lower priority.',
      ),
    input: z
      .any()
      .optional()
      .describe(
        'Arbitrary JSON payload passed to the worker. The structure depends on the work type and should be validated by the worker implementation.',
      ),
    originalWorkId: z
      .string()
      .optional()
      .describe(
        'Reference to the original work item ID. Useful for tracking retries, parent-child relationships, or audit trails.',
      ),
    scheduled: z
      .string()
      .datetime()
      .optional()
      .describe(
        'ISO 8601 timestamp when the job should be executed. If omitted, the job is immediately available for processing.',
      ),
    retries: z
      .number()
      .int()
      .min(0)
      .max(1000)
      .default(20)
      .describe('Maximum number of retry attempts allowed for this job. Default: 20.'),
    worker: z
      .string()
      .optional()
      .describe(
        'Specific worker identifier to assign this job to. If provided, only that worker can process this job.',
      ),
  }),

  WORKER_ACTIVE_WORK_TYPES: ActiveWorkTypesSchema.describe(
    'Current active work types in the system. This includes all registered worker types that can process jobs. The list is dynamically generated based on the workers currently available. No parameters expected.',
  ),

  WORKER_ALLOCATE: z.object({
    types: z
      .array(z.string())
      .nonempty()
      .optional()
      .describe(
        'List of work types to allocate. If provided, only tasks matching one of these types will be allocated to the worker.',
      ),
    worker: z
      .string()
      .optional()
      .describe(
        'Worker identifier that will process the allocated task. Used for tracking and locking the work item to this worker.',
      ),
  }),

  WORKER_REMOVE: z.object({
    workId: z.string().describe('Unique identifier of the work item to remove from the queue.'),
  }),

  WORKER_GET: z.object({
    workId: z.string().min(1).describe('Unique identifier of the work item to retrieve'),
  }),

  WORKER_LIST: z.object({
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
    created: z
      .object(DateRangeSchema)
      .optional()
      .describe('Date range filter for when work items were created'),
    status: z
      .array(z.enum(WorkStatusKeys))
      .optional()
      .describe('Filter by work item status (NEW, ALLOCATED, SUCCESS, FAILED, DELETED)'),
    types: z.array(z.string()).optional().describe('Filter by specific work types'),
  }),

  WORKER_COUNT: z.object({
    ...SearchSchema,
    created: z
      .object(DateRangeSchema)
      .optional()
      .describe('Date range filter for when work items were created'),
    status: z
      .array(z.enum(WorkStatusKeys))
      .optional()
      .describe('Filter by work item status (NEW, ALLOCATED, SUCCESS, FAILED, DELETED)'),
    types: z.array(z.string()).optional().describe('Filter by specific work types'),
  }),

  WORKER_FINISH_WORK: z.object({
    workId: z.string().describe('Unique identifier of the work item to mark as completed.'),
    result: z
      .unknown()
      .optional()
      .describe('JSON result data produced by the work execution. Can be any valid JSON value.'),
    error: z
      .unknown()
      .optional()
      .describe(
        'Error information if the work failed. Can be an error message, stack trace, or error object.',
      ),
    success: z
      .boolean()
      .describe('Whether the work completed successfully. Required to mark work as finished.'),
    worker: z
      .string()
      .optional()
      .describe(
        'Identifier of the worker that completed the task. Used for logging and tracking purposes.',
      ),
    started: z.date().optional().describe('Timestamp when the worker began executing this work item.'),
    finished: z
      .date()
      .optional()
      .describe('Timestamp when the work execution completed (success or failure).'),
  }),

  WORKER_PROCESS_NEXT: z.object({
    worker: z
      .string()
      .optional()
      .describe(
        'Worker identifier for task allocation. If provided, assigns the next available task to this specific worker.',
      ),
  }),

  WORKER_STATISTICS: z.object({
    types: z.array(z.string()).optional().describe('Filter statistics by specific work types'),
    dateRange: z.object(DateRangeSchema).optional().describe('Date range to filter work statistics'),
  }),

  EVENT_GET: z.object({
    eventId: z
      .string()
      .min(1)
      .describe('Unique identifier of the event to retrieve from the event history'),
  }),

  EVENT_LIST: z.object({
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
    types: z
      .array(z.string())
      .optional()
      .describe('Filter events by specific event types (e.g., USER_CREATED, ORDER_PLACED)'),
    created: z
      .string()
      .datetime()
      .optional()
      .describe('ISO 8601 timestamp to filter events created on or after this date/time'),
  }),

  EVENT_COUNT: z.object({
    ...SearchSchema,
    types: z
      .array(z.string())
      .optional()
      .describe('Filter events by specific event types (e.g., USER_CREATED, ORDER_PLACED)'),
    created: z
      .string()
      .datetime()
      .optional()
      .describe('ISO 8601 timestamp to filter events created on or after this date/time'),
  }),

  EVENT_STATISTICS: z.object({
    types: z
      .array(z.string())
      .optional()
      .describe('Filter statistics by specific event types. If not provided, includes all event types'),
    dateRange: z
      .object(DateRangeSchema)
      .optional()
      .describe('Date range to filter event statistics. Includes start and/or end dates'),
  }),
} as const;

export const SystemManagementSchema = {
  action: z
    .enum([
      'SHOP_INFO',
      'WORKER_ADD',
      'WORKER_REMOVE',
      'WORKER_COUNT',
      'WORKER_GET',
      'WORKER_LIST',
      'WORKER_STATISTICS',
      'WORKER_PROCESS_NEXT',
      'WORKER_ALLOCATE',
      'WORKER_FINISH_WORK',
      'WORKER_ACTIVE_WORK_TYPES',
      'EVENT_GET',
      'EVENT_LIST',
      'EVENT_COUNT',
      'EVENT_STATISTICS',
    ])
    .describe(
      'Action to perform on the system. CRITICAL: SHOP_INFO (MANDATORY first call when locale/language/country/currency defaults are needed - returns authoritative fallbacks). Worker actions: WORKER_ADD (add work), WORKER_ALLOCATE (assign work), WORKER_REMOVE (delete work), WORKER_GET (retrieve work), WORKER_LIST (search work), WORKER_COUNT (count work), WORKER_FINISH_WORK (complete work), WORKER_PROCESS_NEXT (get next work), WORKER_STATISTICS (work stats), WORKER_ACTIVE_WORK_TYPES (get active work types). Event actions: EVENT_GET (retrieve event), EVENT_LIST (search events), EVENT_COUNT (count events), EVENT_STATISTICS (event stats). Always call SHOP_INFO first when user lacks localization context.',
    ),

  type: z
    .string()
    .min(1)
    .optional()
    .describe(
      'Work type key for WORKER_ADD action. Determines which worker/handler will process the job.',
    ),
  priority: z
    .number()
    .int()
    .optional()
    .describe('Job priority for WORKER_ADD action. Higher values processed first. Default: 0.'),
  input: z
    .any()
    .optional()
    .describe('JSON payload for WORKER_ADD action. Structure depends on work type.'),
  originalWorkId: z
    .string()
    .optional()
    .describe(
      'Reference to original work item ID for WORKER_ADD action. For tracking retries/relationships.',
    ),
  scheduled: z
    .string()
    .datetime()
    .optional()
    .describe('ISO 8601 timestamp for WORKER_ADD action. When job should be executed.'),
  retries: z
    .number()
    .int()
    .optional()
    .describe('Maximum retry attempts for WORKER_ADD action. Default: 20.'),
  worker: z
    .string()
    .optional()
    .describe(
      'Worker identifier. Used in WORKER_ADD, WORKER_ALLOCATE, WORKER_FINISH_WORK, WORKER_PROCESS_NEXT actions.',
    ),
  workId: z
    .string()
    .optional()
    .describe(
      'Unique work identifier. Required for WORKER_GET, WORKER_REMOVE, WORKER_FINISH_WORK actions.',
    ),
  result: z
    .unknown()
    .optional()
    .describe('JSON result data for WORKER_FINISH_WORK action. Produced by work execution.'),
  error: z
    .unknown()
    .optional()
    .describe('Error information for WORKER_FINISH_WORK action. Used when work fails.'),
  success: z
    .boolean()
    .optional()
    .describe('Success status for WORKER_FINISH_WORK action. Required to mark work as finished.'),
  started: z
    .date()
    .optional()
    .describe('Start timestamp for WORKER_FINISH_WORK action. When worker began execution.'),
  finished: z
    .date()
    .optional()
    .describe('Finish timestamp for WORKER_FINISH_WORK action. When work completed.'),
  status: z
    .array(z.enum(WorkStatusKeys))
    .optional()
    .describe('Status filter for WORKER_LIST/WORKER_COUNT actions. Work item statuses to include.'),

  eventId: z
    .string()
    .optional()
    .describe('Unique event identifier. Required for EVENT_GET action to retrieve a specific event.'),
  created: z
    .string()
    .datetime()
    .optional()
    .describe(
      'ISO 8601 timestamp filter for EVENT_LIST/EVENT_COUNT actions. Shows events created on or after this date/time.',
    ),

  types: z
    .array(z.string())
    .optional()
    .describe(
      'Filter by specific types. For worker actions: work types. For event actions: event types (e.g., USER_CREATED, ORDER_PLACED).',
    ),
  ...PaginationSchema,
  ...SortingSchema,
  ...SearchSchema,
  dateRange: z
    .object(DateRangeSchema)
    .optional()
    .describe(
      'Date range filter for WORKER_STATISTICS/EVENT_STATISTICS actions. Filter statistics by date range.',
    ),
};

export const SystemManagementZodSchema = z.object(SystemManagementSchema);
export type SystemManagementParams = z.infer<typeof SystemManagementZodSchema>;

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (modules: any, params: Params<T>) => Promise<unknown>;
