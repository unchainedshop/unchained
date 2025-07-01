import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const TranslatedProductMediaTextsSchema = {
  productMediaId: z.string().min(1).describe('ID of the product media to fetch translated texts for'),
};

export const TranslatedProductMediaTextsZodSchema = z.object(TranslatedProductMediaTextsSchema);

export type TranslatedProductMediaTextsParams = z.infer<typeof TranslatedProductMediaTextsZodSchema>;

export async function translatedProductMediaTextsHandler(
  context: Context,
  params: TranslatedProductMediaTextsParams,
) {
  const { productMediaId } = params;
  const { modules, userId } = context;

  try {
    log(`handler translatedProductMediaTexts: ${productMediaId}`, { userId });

    const texts = await modules.products.media.texts.findMediaTexts({ productMediaId });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ texts }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error getting translated product media texts: ${(error as Error).message}`,
        },
      ],
    };
  }
}
