import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const ReorderAssortmentLinkInputSchema = z.object({
  assortmentLinkId: z.string().min(1).describe('ID of the assortment link to reorder'),
  sortKey: z.number().describe('New sorting key for the link'),
});

export const ReorderAssortmentLinksSchema = {
  sortKeys: z
    .array(ReorderAssortmentLinkInputSchema)
    .min(1)
    .describe('Array of assortmentLinkId with their new sort keys'),
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
    log('handler reorderAssortmentLinksHandler', { userId, params });

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
