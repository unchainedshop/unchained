import { z } from 'zod';
import { Context } from '../../../context.js';
import { ProductNotFoundError, ProductWrongStatusError } from '../../../errors.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';
import { log } from '@unchainedshop/logger';

export const ProductPlanUsageCalculationTypeEnum = z.enum(['LICENSED', 'METERED'], {
  description:
    'Determines how usage is calculated for the product plan. LICENSED means a fixed license count, METERED means usage is tracked dynamically.',
});

export const ProductPlanConfigurationIntervalEnum = z.enum(
  ['HOURS', 'DAYS', 'WEEKS', 'MONTHS', 'YEARS'],
  {
    description:
      'Defines the time unit for billing intervals and trial periods (e.g., MONTHS means billing every month).',
  },
);

export const UpdateProductPlanInputSchema = z.object({
  usageCalculationType: ProductPlanUsageCalculationTypeEnum.describe(
    'The billing usage calculation method for the product plan.',
  ),
  billingInterval: ProductPlanConfigurationIntervalEnum.describe(
    'The interval unit used for billing cycles.',
  ),
  billingIntervalCount: z
    .number()
    .int()
    .positive()
    .describe('The number of billing intervals per billing cycle (e.g., 3 for every 3 months).'),
  trialInterval: ProductPlanConfigurationIntervalEnum.optional().describe(
    'Optional trial period interval unit before billing starts.',
  ),
  trialIntervalCount: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Number of trial intervals before the billing cycle starts.'),
});

export const UpdateProductPlanSchema = {
  productId: z.string().min(1).describe('ID of the product of type PLAN_PRODUCT to update only'),
  plan: UpdateProductPlanInputSchema.describe('Configuration settings for the product plan.'),
};

export const UpdateProductPlanZodSchema = z.object(UpdateProductPlanSchema);

export type UpdateProductPlanParams = z.infer<typeof UpdateProductPlanZodSchema>;

export async function updateProductPlanHandler(context: Context, params: UpdateProductPlanParams) {
  const { productId, plan } = params;
  const { modules, userId } = context;

  try {
    log('handler updateProductPlanHandler', { userId, params });
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
