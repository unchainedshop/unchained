import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { ProductVariationNotFoundError } from '../../../errors.js';

export const ProductVariationTextInputSchema = z.object({
  locale: z.string().min(1).describe('Locale code (e.g., "en", "de")'),
  title: z.string().optional().describe('Title of the variation in the given locale'),
  subtitle: z.string().optional().describe('Subtitle of the variation in the given locale'),
});

export const UpdateProductVariationTextsSchema = {
  productVariationId: z.string().min(1).describe('ID of the product variation to update'),
  productVariationOptionValue: z
    .string()
    .optional()
    .describe('Optional production option value to filter variations'),
  texts: z
    .array(ProductVariationTextInputSchema)
    .min(1)
    .describe('Localized texts to apply to the variation'),
};

export const UpdateProductVariationTextsZodSchema = z.object(UpdateProductVariationTextsSchema);

export type UpdateProductVariationTextsParams = z.infer<typeof UpdateProductVariationTextsZodSchema>;

export async function updateProductVariationTextsHandler(
  context: Context,
  params: UpdateProductVariationTextsParams,
) {
  const { productVariationId, productVariationOptionValue, texts } = params;
  const { modules, userId } = context;

  try {
    log('handler updateProductVariationTextsHandler', { userId, params });
    const productVariation = await modules.products.variations.findProductVariation({
      productVariationId,
    });
    if (!productVariation) throw new ProductVariationNotFoundError({ productVariationId });

    const updatedTexts = await modules.products.variations.texts.updateVariationTexts(
      productVariationId,
      texts as any,
      productVariationOptionValue,
    );
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ texts: updatedTexts, productId: productVariation.productId }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error updating product warehousing: ${(error as Error).message}`,
        },
      ],
    };
  }
}
