import { z } from 'zod';
import { Context } from '../../context.js';
import { ProductNotFoundError, ProductWrongStatusError } from '../../errors.js';
import normalizeMediaUrl from './normalizeMediaUrl.js';

export const PublishProductSchema = {
  productId: z.string().min(1).describe('ID of the product to publish'),
};

export const PublishProductZodSchema = z.object(PublishProductSchema);

export type PublishProductParams = z.infer<typeof PublishProductZodSchema>;

export async function publishProductHandler(context: Context, params: PublishProductParams) {
  const { productId } = params;
  const { modules } = context;
  try {
    const product = await modules.products.findProduct({ productId });
    if (!product) throw new ProductNotFoundError({ productId });

    if (!(await modules.products.publish(product))) {
      throw new ProductWrongStatusError({ status: product.status });
    }

    const publishedProduct = await modules.products.findProduct({ productId });

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
            product: { ...publishedProduct, texts, media },
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error publishing product: ${(error as Error).message}`,
        },
      ],
    };
  }
}
