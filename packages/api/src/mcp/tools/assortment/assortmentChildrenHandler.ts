import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { getNormalizedAssortmentDetails } from '../../utils/getNormalizedAssortmentDetails.js';

export const AssortmentChildrenSchema = {
  assortmentId: z.string().min(1).optional().describe('ID of the assortment to fetch'),
};

export const AssortmentChildrenZodSchema = z.object(AssortmentChildrenSchema);

export type AssortmentChildrenParams = z.infer<typeof AssortmentChildrenZodSchema>;

export async function assortmentChildrenHandler(context: Context, params: AssortmentChildrenParams) {
  const { userId, modules } = context;
  const { assortmentId } = params;

  try {
    log('handler assortmentChildren', { userId, params });
    const assortmentChildren = await modules.assortments.children({
      assortmentId,
    });

    const normalizedAssortmentChildren = await Promise.all(
      assortmentChildren.map(async ({ _id }) =>
        getNormalizedAssortmentDetails({ assortmentId: _id }, context),
      ),
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ assortments: normalizedAssortmentChildren }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error getting assortment children: ${(error as Error).message}`,
        },
      ],
    };
  }
}
