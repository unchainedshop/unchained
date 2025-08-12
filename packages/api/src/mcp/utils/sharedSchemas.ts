import { z } from 'zod';
import { SortDirection } from '@unchainedshop/utils';

const sortDirectionKeys = Object.keys(SortDirection) as [string, ...string[]];

export const PaginationSchema = {
  limit: z.number().int().min(1).max(100).optional().describe('Maximum number of results to return'),
  offset: z.number().int().min(0).optional().describe('Number of results to skip for pagination'),
};

export const SortingSchema = {
  sort: z
    .array(
      z.object({
        key: z.string().describe('Field to sort by'),
        value: z.enum(sortDirectionKeys).describe('Sort direction (ASC/DESC)'),
      }),
    )
    .optional()
    .describe('Array of sort options'),
};

export const SearchSchema = {
  queryString: z.string().optional().describe('Search query string for text-based filtering'),
  includeInactive: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to include inactive/disabled items'),
};

export const LocalizationTextSchema = z.object({
  locale: z
    .string()
    .min(2)
    .describe(
      'Locale code (e.g., "en-US", "de-CH") when a user provides locale make sure it exists in the system languages first. and if not prompt them to add the language before using it. if they provide a dialect at least base language should be registered in the system. if it does not exists prompt the user to add the language. NEVER add it automatically',
    ),
  title: z.string().min(1).describe('Localized title'),
  subtitle: z.string().optional().describe('Optional localized subtitle'),
});

export const DateRangeSchema = {
  from: z.string().datetime().optional().describe('Start date in ISO format'),
  to: z.string().datetime().optional().describe('End date in ISO format'),
};

export const OrderFilterSchema = {
  paymentProviderIds: z.array(z.string()).optional().describe('Filter by payment provider IDs'),
  deliveryProviderIds: z.array(z.string()).optional().describe('Filter by delivery provider IDs'),
  status: z
    .array(z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']))
    .optional()
    .describe('Filter by order statuses'),
};

export const EntityIdSchema = {
  id: z.string().min(1).optional().describe('Entity ID'),
};

export const MediaUrlSchema = {
  url: z.string().url().optional().describe('Media URL'),
};

export function createManagementSchema<T extends readonly string[]>(
  actions: T,
  additionalFields: Record<string, z.ZodType> = {},
) {
  return {
    action: z.enum(actions as any).describe(`Management action: ${actions.join(', ')}`),
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
    ...additionalFields,
  };
}

export function createMcpResponse(response) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ ...response }),
      },
    ],
  };
}

export function createMcpErrorResponse(action: string, error: Error) {
  return {
    content: [
      {
        type: 'text' as const,
        text: `Error in ${action.toLowerCase()}: ${error.message}`,
      },
    ],
  };
}
