import { z } from 'zod';
import { Context } from '../../context.js';
import { ProductNotFoundError, ProductWrongStatusError } from '../../errors.js';
import normalizeMediaUrl from './normalizeMediaUrl.js';

export const UnpublishProductSchema = {
  productId: z.string().min(1).describe('ID of the product to unpublish'),
};

export const UnpublishProductZodSchema = z.object(UnpublishProductSchema);

export type UnpublishProductParams = z.infer<typeof UnpublishProductZodSchema>;

export async function unpublishProductHandler(context: Context, params: UnpublishProductParams) {
  const { productId } = params;
  const { modules } = context;

  try {
    const product = await modules.products.findProduct({ productId });
    if (!product) throw new ProductNotFoundError({ productId });

    if (!(await modules.products.unpublish(product))) {
      throw new ProductWrongStatusError({ status: product.status });
    }

    const unPublishedProduct = await modules.products.findProduct({ productId });

    const texts = await context.loaders.productTextLoader.load({
      productId: product._id,
      locale: context.locale,
    });

    const productMedias = await context.modules.products.media.findProductMedias({
      productId: product._id,
    });
    const media = await normalizeMediaUrl(productMedias, context);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            product: {
              ...unPublishedProduct,
              texts,
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
          text: `Error unPublishing product: ${(error as Error).message}`,
        },
      ],
    };
  }
}
