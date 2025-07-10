import { Context } from '../../../context.js';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../errors.js';
import normalizeMediaUrl from '../../utils/normalizeMediaUrl.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { log } from '@unchainedshop/logger';
import { z } from 'zod';

export const ProductBundleItemsSchema = {
  productId: z.string().min(1).describe('ID of the product of type BUNDLE to retrieve its bundle items'),
};

export const ProductBundleItemsZodSchema = z.object(ProductBundleItemsSchema);
export type ProductBundleItemsParams = z.infer<typeof ProductBundleItemsZodSchema>;

export const productBundleItemsHandler = async (context: Context, params: ProductBundleItemsParams) => {
  const { modules, userId, loaders, locale } = context;
  const { productId } = params;

  log('handler productBundleItemsHandler', { userId, params });
  try {
    const product = await modules.products.findProduct({ productId });
    if (!product) throw new ProductNotFoundError({ productId });

    if (product.type !== ProductTypes.BundleProduct) {
      throw new ProductWrongTypeError({
        productId,
        received: product.type,
        required: ProductTypes.BundleProduct,
      });
    }

    const normalizedBundleItems = await Promise.all(
      (product.bundleItems || []).map(async (item) => {
        const product = await loaders.productLoader.load({
          productId: item.productId,
        });
        const productMedias = await modules.products.media.findProductMedias({ productId: product._id });
        const media = await normalizeMediaUrl(productMedias, context);
        const texts = await loaders.productTextLoader.load({
          productId,
          locale,
        });
        return {
          product: {
            ...product,
            media,
            texts,
          },
          ...item,
        };
      }),
    );
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ bundleItems: normalizedBundleItems }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error fetching bundle items: ${(error as Error).message}`,
        },
      ],
    };
  }
};
