import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { AssortmentNotFoundError, ProductNotFoundError } from '../../../errors.js';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';
import { getNormalizedAssortmentDetails } from '../../utils/getNormalizedAssortmentDetails.js';

export const AddAssortmentProductSchema = {
  assortmentId: z.string().min(1).describe('ID of the assortment to add the product to'),
  productId: z.string().min(1).describe('ID of the product to add'),
  tags: z
    .array(z.string().min(1).toLowerCase())
    .optional()
    .describe('Optional tags to associate with this product inside the assortment'),
};

export const AddAssortmentProductZodSchema = z.object(AddAssortmentProductSchema);
export type AddAssortmentProductParams = z.infer<typeof AddAssortmentProductZodSchema>;

export async function addAssortmentProductHandler(context: Context, params: AddAssortmentProductParams) {
  const { modules, userId } = context;
  const { assortmentId, productId, tags } = params;
  try {
    log('mutation addAssortmentProduct', { userId, params });
    const assortment = await getNormalizedAssortmentDetails({ assortmentId }, context);
    if (!assortment)
      throw new AssortmentNotFoundError({
        assortmentId,
      });
    const product = await getNormalizedProductDetails(productId, context);
    if (!product) throw new ProductNotFoundError({ productId });

    const assortmentProduct = await modules.assortments.products.create({
      assortmentId,
      productId,
      tags,
    } as any);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ assortmentProduct: { ...assortmentProduct, assortment, product } }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error adding product to assortment product: ${(error as Error).message}`,
        },
      ],
    };
  }
}
