import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { getNormalizedFilterDetails } from '../../utils/getNormalizedFilterDetails.js';

const SortOptionInputSchema = z.object({
  key: z.string().min(1).describe('Field key to sort by (e.g., "key", "createdAt")'),
  value: z.enum(['ASC', 'DESC']).describe('Sort direction: ASC for ascending, DESC for descending'),
});

export const GetFiltersSchema = {
  limit: z.number().min(1).max(100).default(20).describe('Maximum number of filters to return'),
  offset: z.number().min(0).default(0).describe('Number of filters to skip (for pagination)'),
  includeInactive: z.boolean().default(false).describe('Include inactive filters in the result'),
  queryString: z.string().optional().describe('Free-text search filter (e.g., part of key or title)'),
  sort: z.array(SortOptionInputSchema).optional().describe('List of sort options to order the filters'),
};

export const GetFiltersZodSchema = z.object(GetFiltersSchema);

export type GetFiltersParams = z.infer<typeof GetFiltersZodSchema>;

export async function getFiltersHandler(context: Context, params: GetFiltersParams) {
  const { modules, userId } = context;

  try {
    log('handler getFiltersHandler', {
      userId,
      params,
    });

    const filters = await modules.filters.findFilters(params as any);
    const normalizedFilters = await await Promise.all(
      filters.map(async ({ _id }) => getNormalizedFilterDetails(_id, context)),
    );
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ filters: normalizedFilters }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error fetching filters: ${(error as Error).message}`,
        },
      ],
    };
  }
}
