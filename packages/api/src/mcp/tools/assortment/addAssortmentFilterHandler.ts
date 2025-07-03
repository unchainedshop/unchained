import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { AssortmentNotFoundError, FilterNotFoundError } from '../../../errors.js';
import { getNormalizedAssortmentDetails } from '../../utils/getNormalizedAssortmentDetails.js';
import { getNormalizedFilterDetails } from '../../utils/getNormalizedFilterDetails.js';

export const AddAssortmentFilterSchema = {
  assortmentId: z.string().min(1).describe('ID of the assortment to which the filter will be added.'),

  filterId: z.string().min(1).describe('ID of the filter being added to the assortment.'),

  tags: z
    .array(z.string().regex(/^[a-z0-9-_]+$/))
    .optional()
    .describe(
      'Optional array of lowercase tags (letters, numbers, hyphens, underscores). Used to label or categorize the filter connection.',
    ),
};

export const AddAssortmentFilterZodSchema = z.object(AddAssortmentFilterSchema);

export type AddAssortmentFilterParams = z.infer<typeof AddAssortmentFilterZodSchema>;

export async function addAssortmentFilterHandler(context: Context, params: AddAssortmentFilterParams) {
  const { assortmentId, filterId, tags = [] } = params;
  const { modules, userId } = context;

  try {
    log('handler addAssortmentFilter', { userId, assortmentId, filterId, tags });
    const assortment = await getNormalizedAssortmentDetails({ assortmentId }, context);
    if (!assortment) throw new AssortmentNotFoundError({ assortmentId });
    const filter = await getNormalizedFilterDetails(filterId, context);
    if (!filter) throw new FilterNotFoundError({ filterId });

    const assortmentFilter = await modules.assortments.filters.create({
      assortmentId,
      filterId,
      tags,
    } as any);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            assortmentFilter: {
              ...assortmentFilter,
              filter,
              assortment,
            },
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error adding filter to assortment: ${(error as Error).message}`,
        },
      ],
    };
  }
}
