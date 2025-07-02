import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const ReorderAssortmentLinkInputSchema = z.object({
  assortmentLinkId: z.string().min(1),
  sortKey: z.number(),
});

export const ReorderAssortmentLinksSchema = {
  sortKeys: z
    .array(ReorderAssortmentLinkInputSchema)
    .min(1)
    .describe('New sort order for assortment links'),
};

export const ReorderAssortmentLinksZodSchema = z.object(ReorderAssortmentLinksSchema);

export type ReorderAssortmentLinksParams = z.infer<typeof ReorderAssortmentLinksZodSchema>;

export async function reorderAssortmentLinksHandler(
  context: Context,
  params: ReorderAssortmentLinksParams,
) {
  const { sortKeys } = params;
  const { modules, userId } = context;

  try {
    log('handler reorderAssortmentLinks', { userId, sortKeys });

    await modules.assortments.links.updateManualOrder({
      sortKeys: sortKeys,
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
          text: `Error reordering assortment links: ${(error as Error).message}`,
        },
      ],
    };
  }
}
