import { z } from 'zod';
import { Context } from '../../context.js';

export const RemoveProductSchema = {
  productId: z.string().min(1).describe('ID of the product to remove'),
};

export const RemoveProductZodSchema = z.object(RemoveProductSchema);

export type RemoveProductParams = z.infer<typeof RemoveProductZodSchema>;

export async function removeProductHandler(context: Context, params: RemoveProductParams) {
  const { productId } = params;
  const { modules, services } = context;

  try {
    await services.products.removeProduct({ productId });
    const product = await modules.products.findProduct({ productId });
    const productTexts = await context.loaders.productTextLoader.load({
      productId: product._id,
      locale: context.locale,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            product: {
              ...product,
              texts: productTexts,
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
          text: `Error removing product: ${(error as Error).message}`,
        },
      ],
    };
  }
}
