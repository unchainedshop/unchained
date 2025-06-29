import { z } from 'zod';
import { Context } from '../../context.js';
import { log } from '@unchainedshop/logger';
import { ProductMediaNotFoundError } from '../../errors.js';

export const RemoveProductMediaSchema = {
  productMediaId: z.string().min(1).describe('ID of the product media to be removed'),
};

export const RemoveProductMediaZodSchema = z.object(RemoveProductMediaSchema);

export type RemoveProductMediaParams = z.infer<typeof RemoveProductMediaZodSchema>;

export async function removeProductMediaHandler(context: Context, params: RemoveProductMediaParams) {
  const { productMediaId } = params;
  const { modules, userId } = context;

  try {
    log('removeProductMediaHandler', { userId, productMediaId });

    const productMedia = await modules.products.media.findProductMedia({
      productMediaId,
    });
    if (!productMedia) throw new ProductMediaNotFoundError({ productMediaId });

    await modules.files.delete(productMedia.mediaId);
    await modules.products.media.delete(productMediaId);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            media: productMedia,
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error removing product media: ${(error as Error).message}`,
        },
      ],
    };
  }
}
