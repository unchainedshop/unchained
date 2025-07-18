import { z } from 'zod';
import { Context } from '../../../context.js';
import { ProductNotFoundError } from '../../../errors.js';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';
import { log } from '@unchainedshop/logger';

export const UpdateProductSchema = {
  productId: z.string().min(1).describe('ID of the product to update'),
  product: z
    .object({
      tags: z.array(z.string().min(1).toLowerCase()).optional().describe('List of lowercase tags'),
      sequence: z.number().int().optional().describe('Sorting sequence'),
      meta: z.record(z.unknown()).optional().describe('Custom metadata as key-value pairs'),
    })
    .describe('Fields to update on the product'),
};

export const UpdateProductZodSchema = z.object(UpdateProductSchema);

export type UpdateProductParams = z.infer<typeof UpdateProductZodSchema>;

export async function updateProductHandler(context: Context, params: UpdateProductParams) {
  const { productId, product } = params;
  const { modules, userId } = context;

  try {
    log('handler updateProductHandler', { userId, params });
    if (!(await modules.products.productExists({ productId })))
      throw new ProductNotFoundError({ productId });

    await modules.products.update(productId, product);

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
          text: `Error updating product: ${(error as Error).message}`,
        },
      ],
    };
  }
}
