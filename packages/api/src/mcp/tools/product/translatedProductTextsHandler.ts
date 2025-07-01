import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const TranslatedProductTextsSchema = {
  productId: z.string().min(1).describe('ID of the product to fetch translated texts for'),
};

export const TranslatedProductTextsZodSchema = z.object(TranslatedProductTextsSchema);

export type TranslatedProductTextsParams = z.infer<typeof TranslatedProductTextsZodSchema>;

export async function translatedProductTextsHandler(
  context: Context,
  params: TranslatedProductTextsParams,
) {
  const { productId } = params;
  const { modules, userId } = context;

  try {
    log(`handler translatedProductTexts: ${productId}`, { userId });

    const texts = await modules.products.texts.findTexts({ productId });

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
          text: `Error getting translated product texts: ${(error as Error).message}`,
        },
      ],
    };
  }
}
