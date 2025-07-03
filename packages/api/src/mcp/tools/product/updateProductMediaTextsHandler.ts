import { z } from 'zod';
import { Context } from '../../../context.js';
import { ProductMediaNotFoundError } from '../../../errors.js';
import { log } from '@unchainedshop/logger';

export const UpdateProductMediaTextsSchema = {
  productMediaId: z.string().min(1).describe('ID of the media asset to update'),
  texts: z
    .array(
      z.object({
        locale: z
          .string()
          .min(2)
          .describe(
            'locale iso code like "en-US", "de-CH" use default defaultLanguageIsoCode in shop info if not explicitly provided. if language is explicitly provided check if it exists',
          ),
        title: z.string().optional().describe('Title in the given locale'),
        subtitle: z.string().optional().describe('Subtitle in the given locale'),
      }),
    )
    .min(1)
    .describe('List of localized texts to update'),
};

export const UpdateProductMediaTextsZodSchema = z.object(UpdateProductMediaTextsSchema);

export type UpdateProductMediaTextsParams = z.infer<typeof UpdateProductMediaTextsZodSchema>;

export async function updateProductMediaTextsHandler(
  context: Context,
  params: UpdateProductMediaTextsParams,
) {
  const { productMediaId, texts } = params;
  const { modules, userId } = context;

  try {
    log('handler updateProductMediaTextsHandler', { userId, params });
    const productMedia = await modules.products.media.findProductMedia({
      productMediaId,
    });
    if (!productMedia) throw new ProductMediaNotFoundError({ productMediaId });

    const updatedTexts = await modules.products.media.texts.updateMediaTexts(productMediaId, texts);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ texts: updatedTexts }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error updating product media texts: ${(error as Error).message}`,
        },
      ],
    };
  }
}
