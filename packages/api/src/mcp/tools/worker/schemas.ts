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
  ADD: z.object({
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
  ACTIVE_WORK_TYPES: ActiveWorkTypesSchema.describe(
    'Current active work types in the system. This includes all registered worker types that can process jobs. The list is dynamically generated based on the workers currently available. it does not expect any parameter',
  ),
  ALLOCATE: z.object({
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

  REMOVE: z.object({
    workId: z.string().describe('Unique identifier of the work item to remove from the queue.'),
  }),

  GET: z.object({
    workId: z.string().min(1).describe('Unique identifier of the work item to retrieve'),
  }),

  LIST: z.object({
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

  COUNT: z.object({
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

  FINISH_WORK: z.object({
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

  PROCESS_NEXT: z.object({
    worker: z
      .string()
      .optional()
      .describe(
        'Worker identifier for task allocation. If provided, assigns the next available task to this specific worker.',
      ),
  }),

  STATISTICS: z.object({
    types: z.array(z.string()).optional().describe('Filter statistics by specific work types'),
    dateRange: z.object(DateRangeSchema).optional().describe('Date range to filter work statistics'),
  }),
} as const;

export const WorkerManagementSchema = {
  action: z
    .enum([
      'ADD',
      'REMOVE',
      'COUNT',
      'GET',
      'LIST',
      'STATISTICS',
      'PROCESS_NEXT',
      'ALLOCATE',
      'FINISH_WORK',
      'ACTIVE_WORK_TYPES',
    ])
    .describe(
      'Action to perform on the worker queue: ADD (add work), ALLOCATE (assign work), REMOVE (delete work), GET (retrieve work), LIST (search work), COUNT (count work), FINISH_WORK (complete work), PROCESS_NEXT (get next work), STATISTICS (get stats), ACTIVE_WORK_TYPES (get current active work types). Each action has specific parameters and validation requirements.',
    ),
  type: z
    .string()
    .min(1)
    .optional()
    .describe('Work type key for ADD action. Determines which worker/handler will process the job.'),
  priority: z
    .number()
    .int()
    .optional()
    .describe('Job priority for ADD action. Higher values processed first. Default: 0.'),
  input: z.any().optional().describe('JSON payload for ADD action. Structure depends on work type.'),
  originalWorkId: z
    .string()
    .optional()
    .describe('Reference to original work item ID for ADD action. For tracking retries/relationships.'),
  scheduled: z
    .string()
    .datetime()
    .optional()
    .describe('ISO 8601 timestamp for ADD action. When job should be executed.'),
  retries: z.number().int().optional().describe('Maximum retry attempts for ADD action. Default: 20.'),
  worker: z
    .string()
    .optional()
    .describe('Worker identifier. Used in ADD, ALLOCATE, FINISH_WORK, PROCESS_NEXT actions.'),
  types: z
    .array(z.string())
    .optional()
    .describe('Work types to allocate for ALLOCATE action, or filter for LIST/COUNT/STATISTICS.'),
  workId: z
    .string()
    .optional()
    .describe('Unique work identifier. Required for GET, REMOVE, FINISH_WORK actions.'),
  result: z
    .unknown()
    .optional()
    .describe('JSON result data for FINISH_WORK action. Produced by work execution.'),
  error: z
    .unknown()
    .optional()
    .describe('Error information for FINISH_WORK action. Used when work fails.'),
  success: z
    .boolean()
    .optional()
    .describe('Success status for FINISH_WORK action. Required to mark work as finished.'),
  started: z
    .date()
    .optional()
    .describe('Start timestamp for FINISH_WORK action. When worker began execution.'),
  finished: z
    .date()
    .optional()
    .describe('Finish timestamp for FINISH_WORK action. When work completed.'),
  ...PaginationSchema,
  ...SortingSchema,
  ...SearchSchema,
  created: z
    .object(DateRangeSchema)
    .optional()
    .describe('Date range filter for LIST/COUNT actions. When work items were created.'),
  status: z
    .array(z.enum(WorkStatusKeys))
    .optional()
    .describe('Status filter for LIST/COUNT actions. Work item statuses to include.'),
  dateRange: z
    .object(DateRangeSchema)
    .optional()
    .describe('Date range for STATISTICS action. Filter statistics by date range.'),
};

export const WorkerManagementZodSchema = z.object(WorkerManagementSchema);
export type WorkerManagementParams = z.infer<typeof WorkerManagementZodSchema>;

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (WorkerModule: any, params: Params<T>) => Promise<unknown>;
