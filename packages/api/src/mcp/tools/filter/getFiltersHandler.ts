import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { getNormalizedFilterDetails } from '../../utils/getNormalizedFilterDetails.js';

const SortOptionInputSchema = z.object({
  key: z.string().min(1).describe('Field to sort by'),
  value: z.enum(['ASC', 'DESC']).describe('Sort direction'),
});

export const GetFiltersSchema = {
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  includeInactive: z.boolean().default(false),
  queryString: z.string().optional(),
  sort: z.array(SortOptionInputSchema).optional(),
};

export const GetFiltersZodSchema = z.object(GetFiltersSchema);

export type GetFiltersParams = z.infer<typeof GetFiltersZodSchema>;

export async function getFiltersHandler(context: Context, params: GetFiltersParams) {
  const { limit, offset, includeInactive, queryString, sort } = params;
  const { modules, userId } = context;

  try {
    log('handler getFilters', {
      userId,
      limit,
      offset,
      includeInactive,
      queryString,
      sort,
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
