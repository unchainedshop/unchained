import { z } from 'zod';
import { Context } from '../../../context.js';
import { ProductNotFoundError, ProductWrongStatusError } from '../../../errors.js';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';
import { log } from '@unchainedshop/logger';

export const PublishProductSchema = {
  productId: z.string().min(1).describe('ID of the product to publish'),
};

export const PublishProductZodSchema = z.object(PublishProductSchema);

export type PublishProductParams = z.infer<typeof PublishProductZodSchema>;

export async function publishProductHandler(context: Context, params: PublishProductParams) {
  const { productId } = params;
  const { modules, userId } = context;

  try {
    log('handler publishProductHandler', { userId, params });
    const product = await modules.products.findProduct({ productId });
    if (!product) throw new ProductNotFoundError({ productId });

    if (!(await modules.products.publish(product))) {
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
          text: `Error publishing product: ${(error as Error).message}`,
        },
      ],
    };
  }
}
