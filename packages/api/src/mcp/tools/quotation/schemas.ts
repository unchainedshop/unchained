import { z } from 'zod/v4-mini';
import {
  PaginationSchema,
  SortingSchema,
  SearchSchema,
  DateRangeSchema,
  createManagementSchemaFromValidators,
} from '../../utils/sharedSchemas.ts';

export const QuotationStatusEnum = z.enum([
  'REQUESTED',
  'PROCESSING',
  'PROPOSED',
  'FULFILLED',
  'REJECTED',
]);

export const ProductConfigurationInput = z.object({
  key: z.string().check(z.describe('Configuration key')),
  value: z.string().check(z.describe('Configuration value')),
});

export const actionValidators = {
  LIST: z
    .object({
      ...PaginationSchema,
      ...SortingSchema,
      ...SearchSchema,
      ...DateRangeSchema,
      status: z.optional(QuotationStatusEnum).check(z.describe('Filter by quotation status')),
      userId: z.optional(z.string()).check(z.describe('Filter by user ID')),
      productId: z.optional(z.string()).check(z.describe('Filter by product ID')),
    })
    .check(
      z.describe(
        'Retrieves a list of quotations with optional filters. Supports pagination (limit/offset), sorting, text search (queryString), status filtering, and filtering by userId or productId.',
      ),
    ),

  GET: z
    .object({
      quotationId: z
        .string()
        .check(z.minLength(1, 'quotationId is required'), z.describe('Quotation ID to retrieve')),
    })
    .check(
      z.describe('Retrieves a single quotation by ID. Requirements: quotationId must be provided.'),
    ),

  COUNT: z
    .object({
      ...SearchSchema,
      ...DateRangeSchema,
      status: z.optional(QuotationStatusEnum).check(z.describe('Filter by quotation status')),
      userId: z.optional(z.string()).check(z.describe('Filter by user ID')),
      productId: z.optional(z.string()).check(z.describe('Filter by product ID')),
    })
    .check(
      z.describe(
        'Returns the total count of quotations matching the provided filters. Useful for pagination. Accepts same filter parameters as LIST.',
      ),
    ),
  VERIFY: z
    .object({
      quotationId: z
        .string()
        .check(
          z.minLength(1, 'quotationId is required'),
          z.describe('Quotation ID to verify. Must be in REQUESTED status.'),
        ),
      quotationContext: z
        .optional(z.record(z.any(), z.any()))
        .check(
          z.describe('Optional context for verification (e.g., verification notes, approval details)'),
        ),
    })
    .check(
      z.describe(
        'Verifies a quotation and transitions it from REQUESTED to PROCESSING status. Requirements: quotation must exist AND current status must be REQUESTED.',
      ),
    ),

  MAKE_PROPOSAL: z
    .object({
      quotationId: z
        .string()
        .check(
          z.minLength(1, 'quotationId is required'),
          z.describe('Quotation ID to create proposal for. Must be in PROCESSING status.'),
        ),
      quotationContext: z
        .optional(z.record(z.any(), z.any()))
        .check(
          z.describe(
            'Optional context for the proposal (e.g., pricing details, terms, delivery estimates)',
          ),
        ),
    })
    .check(
      z.describe(
        'Creates a proposal for a quotation and transitions it from PROCESSING to PROPOSED status. Requirements: quotation must exist AND current status must be PROCESSING.',
      ),
    ),

  REJECT: z
    .object({
      quotationId: z
        .string()
        .check(
          z.minLength(1, 'quotationId is required'),
          z.describe('Quotation ID to reject. Cannot be FULFILLED.'),
        ),
      quotationContext: z
        .optional(z.record(z.any(), z.any()))
        .check(
          z.describe(
            'Optional context for rejection (e.g., reason for rejection, alternative suggestions)',
          ),
        ),
    })
    .check(
      z.describe(
        'Rejects a quotation and transitions it to REJECTED status. Requirements: quotation must exist AND current status must NOT be FULFILLED (cannot reject completed quotations). Sets rejected timestamp.',
      ),
    ),
} as const;

export const QuotationManagementSchema = createManagementSchemaFromValidators(actionValidators);

export type { ManagementParams as QuotationManagementParams } from '../../utils/sharedSchemas.ts';

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (context: any, params: Params<T>) => Promise<unknown>;
