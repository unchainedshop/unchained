import { z } from 'zod';
import {
  PaginationSchema,
  SortingSchema,
  SearchSchema,
  DateRangeSchema,
} from '../../utils/sharedSchemas.js';

export const QuotationStatusEnum = z.enum([
  'REQUESTED',
  'PROCESSING',
  'PROPOSED',
  'FULLFILLED',
  'REJECTED',
]);

export const ProductConfigurationInput = z.object({
  key: z.string().describe('Configuration key'),
  value: z.string().describe('Configuration value'),
});

export const actionValidators = {
  LIST: z
    .object({
      ...PaginationSchema,
      ...SortingSchema,
      ...SearchSchema,
      ...DateRangeSchema,
      status: QuotationStatusEnum.optional().describe('Filter by quotation status'),
      userId: z.string().optional().describe('Filter by user ID'),
      productId: z.string().optional().describe('Filter by product ID'),
    })
    .describe(
      'Retrieves a list of quotations with optional filters. Supports pagination (limit/offset), sorting, text search (queryString), status filtering, and filtering by userId or productId.',
    ),

  GET: z
    .object({
      quotationId: z.string().min(1, 'quotationId is required').describe('Quotation ID to retrieve'),
    })
    .describe('Retrieves a single quotation by ID. Requirements: quotationId must be provided.'),

  COUNT: z
    .object({
      ...SearchSchema,
      ...DateRangeSchema,
      status: QuotationStatusEnum.optional().describe('Filter by quotation status'),
      userId: z.string().optional().describe('Filter by user ID'),
      productId: z.string().optional().describe('Filter by product ID'),
    })
    .describe(
      'Returns the total count of quotations matching the provided filters. Useful for pagination. Accepts same filter parameters as LIST.',
    ),
  VERIFY: z
    .object({
      quotationId: z
        .string()
        .min(1, 'quotationId is required')
        .describe('Quotation ID to verify. Must be in REQUESTED status.'),
      quotationContext: z
        .record(z.any(), z.any())
        .optional()
        .describe('Optional context for verification (e.g., verification notes, approval details)'),
    })
    .describe(
      'Verifies a quotation and transitions it from REQUESTED to PROCESSING status. Requirements: quotation must exist AND current status must be REQUESTED.',
    ),

  MAKE_PROPOSAL: z
    .object({
      quotationId: z
        .string()
        .min(1, 'quotationId is required')
        .describe('Quotation ID to create proposal for. Must be in PROCESSING status.'),
      quotationContext: z
        .record(z.any(), z.any())
        .optional()
        .describe(
          'Optional context for the proposal (e.g., pricing details, terms, delivery estimates)',
        ),
    })
    .describe(
      'Creates a proposal for a quotation and transitions it from PROCESSING to PROPOSED status. Requirements: quotation must exist AND current status must be PROCESSING.',
    ),

  REJECT: z
    .object({
      quotationId: z
        .string()
        .min(1, 'quotationId is required')
        .describe('Quotation ID to reject. Cannot be FULLFILLED.'),
      quotationContext: z
        .record(z.any(), z.any())
        .optional()
        .describe(
          'Optional context for rejection (e.g., reason for rejection, alternative suggestions)',
        ),
    })
    .describe(
      'Rejects a quotation and transitions it to REJECTED status. Requirements: quotation must exist AND current status must NOT be FULLFILLED (cannot reject completed quotations). Sets rejected timestamp.',
    ),
} as const;

export const QuotationManagementSchema = {
  action: z
    .enum(['LIST', 'GET', 'COUNT', 'VERIFY', 'MAKE_PROPOSAL', 'REJECT'])
    .describe(
      'Quotation action: LIST (get quotations with filters), GET (single quotation by ID), COUNT (count quotations), VERIFY (verify a REQUESTED quotation), MAKE_PROPOSAL (create proposal for PROCESSING quotation), REJECT (reject a quotation)',
    ),

  ...PaginationSchema,
  ...SortingSchema,
  ...SearchSchema,
  ...DateRangeSchema,
  status: QuotationStatusEnum.optional().describe('Filter by quotation status (LIST & COUNT only)'),
  userId: z.string().optional().describe('Filter by user ID (LIST & COUNT only)'),
  productId: z.string().optional().describe('Product ID (LIST, COUNT only)'),
  quotationId: z.string().optional().describe('Quotation ID (GET, VERIFY, MAKE_PROPOSAL, REJECT only)'),
  configuration: z
    .array(ProductConfigurationInput)
    .optional()
    .describe(
      'Use this to add any additional information for the quotation, it can be how many for when or price or anything a user might want to add',
    ),
  quotationContext: z
    .record(z.any(), z.any())
    .optional()
    .describe('Context object (VERIFY, MAKE_PROPOSAL, REJECT only)'),
};

export const QuotationManagementZodSchema = z.object(QuotationManagementSchema);
export type QuotationManagementParams = z.infer<typeof QuotationManagementZodSchema>;

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (context: any, params: Params<T>) => Promise<unknown>;
