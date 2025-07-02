import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const AssortmentFiltersSchema = {
  assortmentId: z.string().min(1).optional().describe('ID of the assortment to fetch'),
};

export const AssortmentFiltersZodSchema = z.object(AssortmentFiltersSchema);

export type AssortmentFiltersParams = z.infer<typeof AssortmentFiltersZodSchema>;

export async function assortmentFiltersHandler(context: Context, params: AssortmentFiltersParams) {
  const { userId, modules } = context;
  const { assortmentId } = params;

  try {
    log('handler assortmentFilters', { userId, params });
    const assortmentFilters = await modules.assortments.filters.findFilters(
      {
        assortmentId,
      },
      {
        sort: { sortKey: 1 },
      },
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ filters: assortmentFilters }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error getting assortment filters: ${(error as Error).message}`,
        },
      ],
    };
  }
}
