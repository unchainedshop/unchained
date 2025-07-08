import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const ReorderAssortmentMediaInputSchema = z.object({
  assortmentMediaId: z.string().min(1).describe('ID of the assortment media to reorder'),
  sortKey: z.number().describe('New sorting key for the media (lower means higher priority)'),
});

export const ReorderAssortmentMediaSchema = {
  sortKeys: z
    .array(ReorderAssortmentMediaInputSchema)
    .min(1)
    .describe(
      'Array of assortmentMediaId with their new sort keys; the first item will be the primary media',
    ),
};

export const ReorderAssortmentMediaZodSchema = z.object(ReorderAssortmentMediaSchema);

export type ReorderAssortmentMediaParams = z.infer<typeof ReorderAssortmentMediaZodSchema>;

export async function reorderAssortmentMediaHandler(
  context: Context,
  params: ReorderAssortmentMediaParams,
) {
  const { sortKeys } = params;
  const { modules, userId } = context;

  try {
    log('handler reorderAssortmentMediaHandler', { userId, params });

    const media = await modules.assortments.media.updateManualOrder({
      sortKeys,
    } as any);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ media }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error reordering assortment media: ${(error as Error).message}`,
        },
      ],
    };
  }
}
