import { z } from 'zod';
import { Context } from '../../../context.js';
import { ProductWrongTypeError } from '../../../errors.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';
import { log } from '@unchainedshop/logger';

export const UpdateProductWarehousingSchema = {
  productId: z.string().min(1).describe('ID of the SIMPLE_PRODUCT product type to update'),
  warehousing: z
    .object({
      sku: z.string().min(1).optional().describe('Stock keeping unit'),
      baseUnit: z.string().min(1).optional().describe('Base unit of the product (e.g., "piece", "kg")'),
    })
    .describe('Warehousing details to update'),
};

export const UpdateProductWarehousingZodSchema = z.object(UpdateProductWarehousingSchema);

export type UpdateProductWarehousingParams = z.infer<typeof UpdateProductWarehousingZodSchema>;

export async function updateProductWarehousingHandler(
  context: Context,
  params: UpdateProductWarehousingParams,
) {
  const { productId, warehousing } = params;
  const { modules, userId } = context;

  try {
    log('handler updateProductWarehousingHandler', { userId, params });
    const product = await modules.products.findProduct({ productId });
    if (product?.type !== ProductTypes.SimpleProduct)
      throw new ProductWrongTypeError({
        productId,
        received: product.type,
        required: ProductTypes.SimpleProduct,
      });

    await modules.products.update(productId, { warehousing });
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
          text: `Error updating product warehousing: ${(error as Error).message}`,
        },
      ],
    };
  }
}
