import { z } from 'zod';
import { Context } from '../../../context.js';
import { ProductNotFoundError, ProductWrongStatusError } from '../../../errors.js';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';
import { log } from '@unchainedshop/logger';

const ProductStatusActionEnum = z.enum(['PUBLISH', 'UNPUBLISH'], {
  description:
    'Action to perform on the product status - PUBLISH makes it active and available for sale, UNPUBLISH makes it DRAFT and not available for sale',
});

export const UpdateProductStatusSchema = {
  productId: z.string().min(1).describe('ID of the product to change status for'),
  action: ProductStatusActionEnum.describe('Status action to perform on the product'),
};

export const UpdateProductStatusZodSchema = z.object(UpdateProductStatusSchema);

export type UpdateProductStatusParams = z.infer<typeof UpdateProductStatusZodSchema>;

export async function updateProductStatusHandler(context: Context, params: UpdateProductStatusParams) {
  const { productId, action } = params;
  const { modules, userId } = context;

  try {
    log('handler updateProductStatusHandler', { userId, params });
    const product = await modules.products.findProduct({ productId });
    if (!product) throw new ProductNotFoundError({ productId });

    let success: boolean;

    if (action === 'PUBLISH') {
      success = await modules.products.publish(product);
    } else {
      success = await modules.products.unpublish(product);
    }

    if (!success) {
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
          text: `Error ${action.toLowerCase()}ing product: ${(error as Error).message}`,
        },
      ],
    };
  }
}
