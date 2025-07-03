import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { z } from 'zod';

export const ReorderProductMediaSchema = {
  sortKeys: z
    .array(
      z.object({
        productMediaId: z.string().min(1).describe('ID of the media asset'),
        sortKey: z.number().int().describe('New sort key for ordering'),
      }),
    )
    .min(1)
    .describe('Array of product media IDs with their sort order'),
};

export const ReorderProductMediaZodSchema = z.object(ReorderProductMediaSchema);

export type ReorderProductMediaParams = z.infer<typeof ReorderProductMediaZodSchema>;

export async function reorderProductMediaHandler(context: Context, params: ReorderProductMediaParams) {
  const { sortKeys } = params;
  const { modules, userId } = context;

  try {
    log('handler reorderProductMediaHandler', { userId, params });

    const reorderedMedia = await modules.products.media.updateManualOrder({ sortKeys: sortKeys as any });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ reorderedMedia }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error reordering product media: ${(error as Error).message}`,
        },
      ],
    };
  }
}
