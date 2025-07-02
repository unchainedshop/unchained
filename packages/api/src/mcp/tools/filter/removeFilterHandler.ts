import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { FilterNotFoundError } from '../../../errors.js';
import { getNormalizedFilterDetails } from '../../utils/getNormalizedFilterDetails.js';

export const RemoveFilterSchema = {
  filterId: z.string().min(1).describe('ID of the filter to remove'),
};

export const RemoveFilterZodSchema = z.object(RemoveFilterSchema);

export type RemoveFilterParams = z.infer<typeof RemoveFilterZodSchema>;

export async function removeFilterHandler(context: Context, params: RemoveFilterParams) {
  const { filterId } = params;
  const { modules, userId } = context;

  try {
    log(`handler removeFilter: ${filterId}`, { userId });

    const filter = await getNormalizedFilterDetails(filterId, context);
    if (!filter) throw new FilterNotFoundError({ filterId });

    await modules.assortments.filters.deleteMany({ filterId });
    await modules.filters.delete(filterId);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ filter }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error removing filter: ${(error as Error).message}`,
        },
      ],
    };
  }
}
