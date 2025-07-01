import { z } from 'zod';
import { Context } from '../../../context.js';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';

export const RemoveProductSchema = {
  productId: z.string().min(1).describe('ID of the product to remove'),
};

export const RemoveProductZodSchema = z.object(RemoveProductSchema);

export type RemoveProductParams = z.infer<typeof RemoveProductZodSchema>;

export async function removeProductHandler(context: Context, params: RemoveProductParams) {
  const { productId } = params;
  const { services } = context;

  try {
    await services.products.removeProduct({ productId });

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
          text: `Error removing product: ${(error as Error).message}`,
        },
      ],
    };
  }
}
