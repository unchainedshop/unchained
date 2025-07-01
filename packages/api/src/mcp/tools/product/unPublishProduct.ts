import { z } from 'zod';
import { Context } from '../../../context.js';
import { ProductNotFoundError, ProductWrongStatusError } from '../../../errors.js';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';

export const UnpublishProductSchema = {
  productId: z.string().min(1).describe('ID of the product to unpublish'),
};

export const UnpublishProductZodSchema = z.object(UnpublishProductSchema);

export type UnpublishProductParams = z.infer<typeof UnpublishProductZodSchema>;

export async function unpublishProductHandler(context: Context, params: UnpublishProductParams) {
  const { productId } = params;
  const { modules } = context;

  try {
    const product = await modules.products.findProduct({ productId });
    if (!product) throw new ProductNotFoundError({ productId });

    if (!(await modules.products.unpublish(product))) {
      throw new ProductWrongStatusError({ status: product.status });
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            product: await getNormalizedProductDetails(productId, context),
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error unPublishing product: ${(error as Error).message}`,
        },
      ],
    };
  }
}
