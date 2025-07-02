import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { FilterNotFoundError } from '../../../errors.js';
import { getNormalizedFilterDetails } from '../../utils/getNormalizedFilterDetails.js';

export const GetFilterSchema = {
  filterId: z.string().min(1).describe('ID of the filter to retrieve'),
};

export const GetFilterZodSchema = z.object(GetFilterSchema);

export type GetFilterParams = z.infer<typeof GetFilterZodSchema>;

export async function getFilterHandler(context: Context, params: GetFilterParams) {
  const { filterId } = params;
  const { userId } = context;

  try {
    log('handler getFilter', { userId, filterId });

    const filter = await getNormalizedFilterDetails(filterId, context);

    if (!filter) {
      throw new FilterNotFoundError({ filterId });
    }

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
          text: `Error retrieving filter: ${(error as Error).message}`,
        },
      ],
    };
  }
}
