import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const ReorderAssortmentMediaInputSchema = z.object({
  assortmentMediaId: z.string().min(1),
  sortKey: z.number(),
});

export const ReorderAssortmentMediaSchema = {
  sortKeys: z
    .array(ReorderAssortmentMediaInputSchema)
    .min(1)
    .describe('New sort order for assortment media (first is primary)'),
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
    log('handler reorderAssortmentMedia', { userId, sortKeys });

    await modules.assortments.media.updateManualOrder({
      sortKeys,
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
          text: `Error reordering assortment media: ${(error as Error).message}`,
        },
      ],
    };
  }
}
