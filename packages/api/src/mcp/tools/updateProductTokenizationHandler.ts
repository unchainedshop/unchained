import { z } from 'zod';
import { Context } from '../../context.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { ProductNotFoundError, ProductWrongStatusError } from '../../errors.js';
import normalizeMediaUrl from './normalizeMediaUrl.js';

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
    const updatedProduct = await modules.products.findProduct({ productId });
    const texts = await context.loaders.productTextLoader.load({
      productId,
      locale: context.locale,
    });

    const productMedias = await context.modules.products.media.findProductMedias({
      productId,
    });
    const media = await normalizeMediaUrl(productMedias, context);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ product: { ...updatedProduct, texts, media } }),
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
