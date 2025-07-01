import { z } from 'zod';
import { Context } from '../../../context.js';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';
import { ProductVariationNotFoundError } from '../../../errors.js';

export const RemoveProductVariationOptionSchema = {
  productVariationId: z
    .string()
    .min(1)
    .describe('ID of the product variation, it should be a CONFIGURABLE_PRODUCT type only'),
  productVariationOptionValue: z
    .string()
    .min(1)
    .describe('existing Option value in the product to remove (e.g., "Red")'),
};

export const RemoveProductVariationOptionZodSchema = z.object(RemoveProductVariationOptionSchema);
export type RemoveProductVariationOptionParams = z.infer<typeof RemoveProductVariationOptionZodSchema>;

export async function removeProductVariationOptionHandler(
  context: Context,
  params: RemoveProductVariationOptionParams,
) {
  const { productVariationId, productVariationOptionValue } = params;
  const { modules } = context;

  try {
    const productVariation = await modules.products.variations.findProductVariation({
      productVariationId,
    });
    if (!productVariation) throw new ProductVariationNotFoundError({ productVariationId });

    await modules.products.variations.removeVariationOption(
      productVariationId,
      productVariationOptionValue,
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            product: await getNormalizedProductDetails(productVariation.productId, context),
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error removing variation option: ${(error as Error).message}`,
        },
      ],
    };
  }
}
