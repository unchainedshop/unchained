import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { AssortmentFilterNotFoundError } from '../../../errors.js';

export const RemoveAssortmentFilterSchema = {
  assortmentFilterId: z.string().min(1).describe('ID of the assortment filter to remove'),
};

export const RemoveAssortmentFilterZodSchema = z.object(RemoveAssortmentFilterSchema);

export type RemoveAssortmentFilterParams = z.infer<typeof RemoveAssortmentFilterZodSchema>;

export async function removeAssortmentFilterHandler(
  context: Context,
  params: RemoveAssortmentFilterParams,
) {
  const { assortmentFilterId } = params;
  const { modules, userId } = context;

  try {
    log('handler removeAssortmentFilterHandler', { userId, params });

    const assortmentFilter = await modules.assortments.filters.findFilter({
      assortmentFilterId,
    });

    if (!assortmentFilter) throw new AssortmentFilterNotFoundError({ assortmentFilterId });

    await modules.assortments.filters.delete(assortmentFilterId);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ assortmentFilter }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error removing assortment filter: ${(error as Error).message}`,
        },
      ],
    };
  }
}
