import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { getNormalizedAssortmentDetails } from '../../utils/getNormalizedAssortmentDetails.js';

export const AssortmentLinksSchema = {
  assortmentId: z.string().min(1).optional().describe('ID of the assortment to fetch'),
};

export const AssortmentLinksZodSchema = z.object(AssortmentLinksSchema);

export type AssortmentLinksParams = z.infer<typeof AssortmentLinksZodSchema>;

export async function assortmentLinksHandler(context: Context, params: AssortmentLinksParams) {
  const { userId, loaders } = context;
  const { assortmentId } = params;

  try {
    log('handler assortmentLinks', { userId, params });
    const assortmentLinks = await loaders.assortmentLinksLoader.load({
      assortmentId,
    });

    const normalizedAssortmentLinks = await Promise.all(
      assortmentLinks.map(async ({ parentAssortmentId, childAssortmentId, ...rest }) => {
        const parent =
          parentAssortmentId === assortmentId
            ? null
            : await getNormalizedAssortmentDetails({ assortmentId: parentAssortmentId }, context);
        const child =
          childAssortmentId === assortmentId
            ? null
            : await getNormalizedAssortmentDetails({ assortmentId: childAssortmentId }, context);

        return {
          ...rest,
          parent,
          child,
        };
      }),
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ links: normalizedAssortmentLinks }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error getting assortment links: ${(error as Error).message}`,
        },
      ],
    };
  }
}
