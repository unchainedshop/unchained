import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { AssortmentLinkNotFoundError } from '../../../errors.js';

export const RemoveAssortmentLinkSchema = {
  assortmentLinkId: z.string().min(1).describe('ID of the assortment link to remove'),
};

export const RemoveAssortmentLinkZodSchema = z.object(RemoveAssortmentLinkSchema);

export type RemoveAssortmentLinkParams = z.infer<typeof RemoveAssortmentLinkZodSchema>;

export async function removeAssortmentLinkHandler(context: Context, params: RemoveAssortmentLinkParams) {
  const { assortmentLinkId } = params;
  const { modules, userId } = context;

  try {
    log(`handler removeAssortmentLinkHandler`, { userId, params });

    const assortmentLink = await modules.assortments.links.findLink({
      assortmentLinkId,
    });

    if (!assortmentLink) throw new AssortmentLinkNotFoundError({ assortmentLinkId });

    await modules.assortments.links.delete(assortmentLinkId);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ assortmentLink }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error removing assortment link: ${(error as Error).message}`,
        },
      ],
    };
  }
}
