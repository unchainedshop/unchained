import { z } from 'zod';
import { Context } from '../../context.js';
import normalizeMediaUrl from './normalizeMediaUrl.js';

export const UpdateProductCommerceSchema = {
  productId: z.string().min(1).describe('ID of the product to update commerce info'),
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
            currencyCode: z.string().min(3).max(3).describe('ISO currency code (e.g., USD, EUR)'),
            countryCode: z.string().min(2).max(2).describe('ISO country code (e.g., US, DE)'),
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
  const { modules } = context;

  try {
    await modules.products.update(productId, { commerce });

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
          text: `Error updating product commerce info: ${(error as Error).message}`,
        },
      ],
    };
  }
}
