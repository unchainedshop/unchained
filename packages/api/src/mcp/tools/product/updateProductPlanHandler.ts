import { z } from 'zod';
import { Context } from '../../../context.js';
import { ProductNotFoundError, ProductWrongStatusError } from '../../../errors.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';

export const UpdateProductPlanSchema = {
  productId: z.string().min(1).describe('ID of the product of type PLAN_PRODUCT to update only'),
  plan: z.object({
    usageCalculationType: z.string(),
    billingInterval: z.string(),
    billingIntervalCount: z.number().int().positive().optional(),
    trialInterval: z.string().optional(),
    trialIntervalCount: z.number().int().positive().optional(),
  }),
};

export const UpdateProductPlanZodSchema = z.object(UpdateProductPlanSchema);

export type UpdateProductPlanParams = z.infer<typeof UpdateProductPlanZodSchema>;

export async function updateProductPlanHandler(context: Context, params: UpdateProductPlanParams) {
  const { productId, plan } = params;
  const { modules } = context;

  try {
    const product = await modules.products.findProduct({ productId });
    if (!product) throw new ProductNotFoundError({ productId });

    if (product?.type !== ProductTypes.PlanProduct)
      throw new ProductWrongStatusError({
        received: product?.type,
        required: ProductTypes.PlanProduct,
      });

    await modules.products.update(productId, { plan });

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
          text: `Error updating product plan: ${(error as Error).message}`,
        },
      ],
    };
  }
}
