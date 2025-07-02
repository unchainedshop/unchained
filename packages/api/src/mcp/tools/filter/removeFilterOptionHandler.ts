import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { FilterNotFoundError } from '../../../errors.js';
import { getNormalizedFilterDetails } from '../../utils/getNormalizedFilterDetails.js';
import { FilterDirector } from '@unchainedshop/core';

export const RemoveFilterOptionSchema = {
  filterId: z.string().min(1).describe('ID of the filter to remove option from'),
  filterOptionValue: z.string().min(1).describe('Value of the option to remove'),
};

export const RemoveFilterOptionZodSchema = z.object(RemoveFilterOptionSchema);

export type RemoveFilterOptionParams = z.infer<typeof RemoveFilterOptionZodSchema>;

export async function removeFilterOptionHandler(context: Context, params: RemoveFilterOptionParams) {
  const { filterId, filterOptionValue } = params;
  const { modules, userId } = context;

  try {
    log('handler removeFilterOption', { userId, filterId, filterOptionValue });
    const filter = await getNormalizedFilterDetails(filterId, context);
    if (!filter) throw new FilterNotFoundError({ filterId });

    const removedFilterOption = await modules.filters.removeFilterOption({
      filterId,
      filterOptionValue,
    });
    await FilterDirector.invalidateProductIdCache(removedFilterOption, context);

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
          text: `Error removing filter option: ${(error as Error).message}`,
        },
      ],
    };
  }
}
