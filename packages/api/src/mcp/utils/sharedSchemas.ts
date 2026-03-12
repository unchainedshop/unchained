import { z } from 'zod/v4-mini';
import { SortDirection } from '@unchainedshop/utils';

const sortDirectionKeys = Object.keys(SortDirection) as [string, ...string[]];

export const PaginationSchema = {
  limit: z
    .optional(z.int().check(z.gte(1), z.lte(100)))
    .check(z.describe('Maximum number of results to return')),
  offset: z
    .optional(z.int().check(z.gte(0)))
    .check(z.describe('Number of results to skip for pagination')),
};

export const SortingSchema = {
  sort: z
    .optional(
      z.array(
        z.object({
          key: z.string().check(z.describe('Field to sort by')),
          value: z.enum(sortDirectionKeys).check(z.describe('Sort direction (ASC/DESC)')),
        }),
      ),
    )
    .check(z.describe('Array of sort options')),
};

export const SearchSchema = {
  queryString: z.optional(z.string()).check(z.describe('Search query string for text-based filtering')),
  includeInactive: z
    ._default(z.boolean(), true)
    .check(z.describe('Whether to include inactive/disabled items')),
};

export const LocalizationTextSchema = z.object({
  locale: z
    .string()
    .check(
      z.minLength(2),
      z.describe(
        'Locale code (e.g., "en-US", "de-CH"). Must match an available language from the shop languages resource. If the language does not exist, prompt the user to add it first. NEVER add it automatically unless explicitly specified by the user.',
      ),
    ),
  title: z.string().check(z.minLength(1), z.describe('Localized title')),
  subtitle: z.optional(z.string()).check(z.describe('Optional localized subtitle')),
});

export const DateRangeSchema = {
  from: z.optional(z.iso.datetime()).check(z.describe('Start date in ISO format')),
  to: z.optional(z.iso.datetime()).check(z.describe('End date in ISO format')),
};

export const OrderFilterSchema = {
  paymentProviderIds: z
    .optional(z.array(z.string()))
    .check(z.describe('Filter by payment provider IDs')),
  deliveryProviderIds: z
    .optional(z.array(z.string()))
    .check(z.describe('Filter by delivery provider IDs')),
  status: z
    .optional(z.array(z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])))
    .check(z.describe('Filter by order statuses')),
};

export const EntityIdSchema = {
  id: z.optional(z.string().check(z.minLength(1))).check(z.describe('Entity ID')),
};

export const MediaUrlSchema = {
  url: z.optional(z.url()).check(z.describe('Media URL')),
};

export function createManagementSchema<T extends readonly string[]>(
  actions: T,
  additionalFields: Record<string, z.core.$ZodType> = {},
) {
  return {
    action: z.enum(actions as any).check(z.describe(`Management action: ${actions.join(', ')}`)),
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
    ...additionalFields,
  };
}

export interface ManagementParams {
  action: string;
  [key: string]: unknown;
}

type ManagementSchemaShape = { action: z.core.$ZodType<string> } & Record<string, z.core.$ZodType>;

export function createManagementSchemaFromValidators(
  validators: Record<string, { shape: Record<string, z.core.$ZodType> }>,
): ManagementSchemaShape {
  const merged: Record<string, z.core.$ZodType> = {};
  for (const validator of Object.values(validators)) {
    for (const [key, schema] of Object.entries<z.core.$ZodType>(validator.shape)) {
      if (!merged[key]) {
        merged[key] = z.optional(schema);
      }
    }
  }
  return {
    action: z
      .enum(Object.keys(validators) as [string, ...string[]])
      .check(z.describe('Action to perform')),
    ...merged,
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
