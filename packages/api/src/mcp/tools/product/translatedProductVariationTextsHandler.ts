import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const TranslatedProductVariationTextsSchema = {
  productVariationId: z.string().min(1).describe('ID of the product variation'),
  productVariationOptionValue: z
    .string()
    .optional()
    .describe('Optional specific variation option value'),
};

export const TranslatedProductVariationTextsZodSchema = z.object(TranslatedProductVariationTextsSchema);

export type TranslatedProductVariationTextsParams = z.infer<
  typeof TranslatedProductVariationTextsZodSchema
>;

export async function translatedProductVariationTextsHandler(
  context: Context,
  params: TranslatedProductVariationTextsParams,
) {
  const { productVariationId, productVariationOptionValue } = params;
  const { modules, userId } = context;

  try {
    log(`handler translatedProductVariationTexts`, {
      userId,
      params,
    });

    const texts = await modules.products.variations.texts.findVariationTexts({
      productVariationId,
      productVariationOptionValue,
    });

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
          text: `Error getting translated product variation texts: ${(error as Error).message}`,
        },
      ],
    };
  }
}
