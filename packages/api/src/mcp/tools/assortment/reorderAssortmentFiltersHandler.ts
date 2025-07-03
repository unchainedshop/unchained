import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const ReorderAssortmentFilterInputSchema = z.object({
  assortmentFilterId: z.string().min(1).describe('ID of the assortment filter to reorder'),
  sortKey: z.number().int().describe('New sorting key for the filter'),
});

export const ReorderAssortmentFiltersSchema = {
  sortKeys: z
    .array(ReorderAssortmentFilterInputSchema)
    .min(1)
    .describe('Array of assortmentFilterId and their new sort keys'),
};

export const ReorderAssortmentFiltersZodSchema = z.object(ReorderAssortmentFiltersSchema);

export type ReorderAssortmentFiltersParams = z.infer<typeof ReorderAssortmentFiltersZodSchema>;

export async function reorderAssortmentFiltersHandler(
  context: Context,
  params: ReorderAssortmentFiltersParams,
) {
  const { sortKeys } = params;
  const { modules, userId } = context;

  try {
    log('handler reorderAssortmentFiltersHandler', { userId, params });

    await modules.assortments.filters.updateManualOrder({
      sortKeys,
    } as any);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ success: true }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error reordering assortment filters: ${(error as Error).message}`,
        },
      ],
    };
  }
}
