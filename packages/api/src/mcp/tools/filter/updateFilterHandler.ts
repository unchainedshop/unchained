import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { FilterNotFoundError } from '../../../errors.js';
import { FilterDirector } from '@unchainedshop/core';
import { getNormalizedFilterDetails } from '../../utils/getNormalizedFilterDetails.js';

export const UpdateFilterInputSchema = z.object({
  isActive: z.boolean().optional(),
  key: z.string().min(1).optional(),
});

export const UpdateFilterSchema = {
  filterId: z.string().min(1).describe('ID of the filter to update'),
  filter: UpdateFilterInputSchema,
};

export const UpdateFilterZodSchema = z.object(UpdateFilterSchema);

export type UpdateFilterParams = z.infer<typeof UpdateFilterZodSchema>;

export async function updateFilterHandler(context: Context, params: UpdateFilterParams) {
  const { filterId, filter } = params;
  const { modules, userId } = context;

  try {
    log('handler updateFilter', { userId, filterId, filter });
    if (!(await modules.filters.filterExists({ filterId }))) throw new FilterNotFoundError({ filterId });

    const updatedFilter = await modules.filters.update(filterId, filter as any);
    await FilterDirector.invalidateProductIdCache(updatedFilter, context);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ filter: await getNormalizedFilterDetails(filterId, context) }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error updating filter: ${(error as Error).message}`,
        },
      ],
    };
  }
}
