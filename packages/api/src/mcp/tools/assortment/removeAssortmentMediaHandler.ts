import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { AssortmentMediaNotFoundError } from '../../../errors.js';

export const RemoveAssortmentMediaSchema = {
  assortmentMediaId: z
    .string()
    .min(1)
    .describe('Unique ID of the media asset to remove from the assortment.'),
};

export const RemoveAssortmentMediaZodSchema = z.object(RemoveAssortmentMediaSchema);

export type RemoveAssortmentMediaParams = z.infer<typeof RemoveAssortmentMediaZodSchema>;

export async function removeAssortmentMediaHandler(
  context: Context,
  params: RemoveAssortmentMediaParams,
) {
  const { assortmentMediaId } = params;
  const { modules, userId } = context;

  try {
    log(`handler removeAssortmentMedia: ${assortmentMediaId}`, { userId });

    const assortmentMedia = await modules.assortments.media.findAssortmentMedia({
      assortmentMediaId,
    });
    if (!assortmentMedia) throw new AssortmentMediaNotFoundError({ assortmentMediaId });

    await modules.files.delete(assortmentMedia.mediaId);
    await modules.assortments.media.delete(assortmentMediaId);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ assortmentMedia }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error removing assortment media: ${(error as Error).message}`,
        },
      ],
    };
  }
}
