import { z } from 'zod';
import { Context } from '../../../context.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { ProductNotFoundError, ProductWrongStatusError } from '../../../errors.js';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';
import { log } from '@unchainedshop/logger';

export const UpdateProductTokenizationSchema = {
  productId: z.string().min(1).describe('ID of the product of type TOKENIZED_PRODUCT to tokenize only'),
  tokenization: z
    .object({
      contractAddress: z.string().min(1).describe('Blockchain contract address'),
      contractStandard: z.string().describe('Standard of the smart contract (e.g., ERC-721)'),
      tokenId: z.string().min(1).describe('Unique token identifier'),
      supply: z.number().int().positive().describe('Total supply of the token'),
      ercMetadataProperties: z.record(z.any()).optional().describe('Optional ERC metadata properties'),
    })
    .describe('Tokenization details'),
};

export const UpdateProductTokenizationZodSchema = z.object(UpdateProductTokenizationSchema);
export type UpdateProductTokenizationParams = z.infer<typeof UpdateProductTokenizationZodSchema>;

export async function updateProductTokenizationHandler(
  context: Context,
  params: UpdateProductTokenizationParams,
) {
  const { productId, tokenization } = params;
  const { modules, userId } = context;

  try {
    log('handler updateProductTokenizationHandler', { userId, params });
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
