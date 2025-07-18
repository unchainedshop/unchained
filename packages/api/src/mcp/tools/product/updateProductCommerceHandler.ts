import { z } from 'zod';
import { Context } from '../../../context.js';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';
import { log } from '@unchainedshop/logger';

export const UpdateProductCommerceSchema = {
  productId: z
    .string()
    .min(1)
    .describe('ID of the product of all type except for CONFIGURABLE_PRODUCT to update commerce info'),
  commerce: z
    .object({
      pricing: z
        .array(
          z.object({
            amount: z.number().int().describe('Price amount in smallest currency unit (e.g., cents)'),
            maxQuantity: z
              .number()
              .int()
              .optional()
              .describe('Optional maximum quantity for this price tier'),
            isTaxable: z.boolean().optional().describe('Whether tax applies to this price'),
            isNetPrice: z.boolean().optional().describe('Whether this is a net price (without tax)'),
            currencyCode: z
              .string()
              .min(3)
              .max(3)
              .describe(
                'ISO currency code (e.g., USD, EUR) always use values registered in the system and if explicitly provided check if it exists',
              ),
            countryCode: z
              .string()
              .min(2)
              .max(2)
              .describe(
                'ISO country code (e.g., US, DE) always use values registered in the system and if explicitly provided check if it exists',
              ),
          }),
        )
        .nonempty()
        .describe('List of price configurations'),
    })
    .describe('Commerce info to update'),
};

export const UpdateProductCommerceZodSchema = z.object(UpdateProductCommerceSchema);

export type UpdateProductCommerceParams = z.infer<typeof UpdateProductCommerceZodSchema>;

export async function updateProductCommerceHandler(
  context: Context,
  params: UpdateProductCommerceParams,
) {
  const { productId, commerce } = params;
  const { modules, userId } = context;

  try {
    log('handler updateProductCommerceHandler', { userId, params });
    await modules.products.update(productId, { commerce });

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
          text: `Error updating product commerce info: ${(error as Error).message}`,
        },
      ],
    };
  }
}
