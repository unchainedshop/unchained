import { z } from 'zod';
import { Context } from '../../../context.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { ProductNotFoundError, ProductWrongStatusError } from '../../../errors.js';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';

export const UpdateProductTokenizationSchema = {
  productId: z.string().min(1).describe('ID of the product of type TOKENIZED_PRODUCT to tokenize only'),
  tokenization: z.object({
    contractAddress: z.string().min(1),
    contractStandard: z.string(),
    tokenId: z.string().min(1),
    supply: z.number().int().positive(),
    ercMetadataProperties: z.record(z.any()).optional(),
  }),
};

export const UpdateProductTokenizationZodSchema = z.object(UpdateProductTokenizationSchema);
export type UpdateProductTokenizationParams = z.infer<typeof UpdateProductTokenizationZodSchema>;

export async function updateProductTokenizationHandler(
  context: Context,
  params: UpdateProductTokenizationParams,
) {
  const { productId, tokenization } = params;
  const { modules } = context;

  try {
    const product = await modules.products.findProduct({ productId });
    if (!product) throw new ProductNotFoundError({ productId });

    if (product?.type !== ProductTypes.TokenizedProduct)
      throw new ProductWrongStatusError({
        received: product?.type,
        required: ProductTypes.TokenizedProduct,
      });

    await modules.products.update(productId, { tokenization });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ product: await getNormalizedProductDetails(productId, context) }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error updating product tokenization: ${(error as Error).message}`,
        },
      ],
    };
  }
}
