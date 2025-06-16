import { z } from 'zod';
import { Context } from '../../context.js';
import { ProductNotFoundError, ProductWrongStatusError } from '../../errors.js';
import { ProductTypes } from '@unchainedshop/core-products';
import normalizeMediaUrl from './normalizeMediaUrl.js';

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

export const UpdateProductCommerceZodSchema = z.object(UpdateProductPlanSchema);

export type UpdateProductPlanParams = z.infer<typeof UpdateProductCommerceZodSchema>;

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

    const updatedProduct = await modules.products.findProduct({ productId });
    const productTexts = await context.loaders.productTextLoader.load({
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
          text: JSON.stringify({
            product: {
              ...updatedProduct,
              texts: productTexts,
              media,
            },
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
