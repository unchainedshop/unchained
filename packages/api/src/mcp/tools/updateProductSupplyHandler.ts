import { z } from 'zod';
import { Context } from '../../context.js';
import { ProductWrongTypeError } from '../../errors.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { getNormalizedProductDetails } from '../utils/getNormalizedProductDetails.js';

export const UpdateProductSupplySchema = {
  productId: z
    .string()
    .min(1)
    .describe('Product ID of a SIMPLE_PRODUCT only to update supply details for'),
  supply: z
    .object({
      weightInGram: z.number().int().positive().optional(),
      heightInMillimeters: z.number().int().positive().optional(),
      lengthInMillimeters: z.number().int().positive().optional(),
      widthInMillimeters: z.number().int().positive().optional(),
    })
    .describe('Supply (delivery) attributes of the product'),
};

export const UpdateProductSupplyZodSchema = z.object(UpdateProductSupplySchema);

export type UpdateProductSupplyParams = z.infer<typeof UpdateProductSupplyZodSchema>;

export async function updateProductSupplyHandler(context: Context, params: UpdateProductSupplyParams) {
  const { productId, supply } = params;
  const { modules } = context;

  try {
    const product = await modules.products.findProduct({ productId });
    if (product?.type !== ProductTypes.SimpleProduct)
      throw new ProductWrongTypeError({
        productId,
        received: product?.type,
        required: ProductTypes.SimpleProduct,
      });

    await modules.products.update(productId, { supply });

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
          text: `Error updating product supply: ${(error as Error).message}`,
        },
      ],
    };
  }
}
