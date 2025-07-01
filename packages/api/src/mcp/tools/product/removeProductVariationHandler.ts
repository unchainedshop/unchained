import { z } from 'zod';
import { Context } from '../../../context.js';
import { ProductVariationNotFoundError } from '../../../errors.js';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';

export const RemoveProductVariationSchema = {
  productVariationId: z
    .string()
    .min(1)
    .describe('ID of the product variation to remove. it should be a valid product variation ID'),
};

export const RemoveProductVariationZodSchema = z.object(RemoveProductVariationSchema);
export type RemoveProductVariationParams = z.infer<typeof RemoveProductVariationZodSchema>;

export async function removeProductVariationHandler(
  context: Context,
  params: RemoveProductVariationParams,
) {
  const { productVariationId } = params;
  const { modules } = context;

  try {
    const productVariation = await modules.products.variations.findProductVariation({
      productVariationId,
    });
    if (!productVariation) throw new ProductVariationNotFoundError({ productVariationId });

    await modules.products.variations.delete(productVariationId);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            product: await getNormalizedProductDetails(productVariationId, context),
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error removing product variation: ${(error as Error).message}`,
        },
      ],
    };
  }
}
