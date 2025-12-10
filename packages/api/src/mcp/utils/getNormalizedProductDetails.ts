import { ProductType } from '@unchainedshop/core-products';
import type { Context } from '../../context.ts';
import normalizeMediaUrl from './normalizeMediaUrl.ts';
import { createLogger } from '@unchainedshop/logger';
import normalizeProxyAssignments from './normalizeProxyAssignments.ts';

const logger = createLogger('unchained:api:mcp');
export async function getNormalizedProductDetails(productId: string, context: Context) {
  const { modules, locale, loaders } = context;
  const product = await modules.products.findProduct({ productId });

  if (!product) return null;

  const texts = await loaders.productTextLoader.load({
    productId,
    locale,
  });
  let variations: any = [];
  let bundleItems: any = [];
  let assignments: any = [];
  const reviews = await modules.products.reviews.findProductReviews({
    productId,
  });

  if (product.type === ProductType.CONFIGURABLE_PRODUCT) {
    variations = await context.modules.products.variations.findProductVariations({
      productId: product?._id,
    });
    assignments = await Promise.all(
      (product?.proxy?.assignments || [])?.map(async (assignment) =>
        normalizeProxyAssignments(assignment, context),
      ),
    );
  }

  if (product.type === ProductType.BUNDLE_PRODUCT) {
    bundleItems = await Promise.all(
      (product.bundleItems || []).map(async (item) => {
        const bundleItemProduct = await loaders.productLoader.load({
          productId: item.productId,
        });
        const productMedias = await modules.products.media.findProductMedias({
          productId: item.productId,
        });
        const media = await normalizeMediaUrl(productMedias, context);
        const texts = await loaders.productTextLoader.load({
          productId: item.productId,
          locale,
        });
        return {
          product: {
            ...bundleItemProduct,
            media,
            texts,
          },
          ...item,
        };
      }),
    );
  }

  // Get pricing information
  let pricing: any = null;
  try {
    pricing = await context.modules.products.prices.price(product, {
      countryCode: context.countryCode,
    });
  } catch {
    // Pricing might not be available for all products
    logger.warn('Pricing not available for product:', product._id);
  }

  const productMedias = await modules.products.media.findProductMedias({ productId });
  const media = await normalizeMediaUrl(productMedias, context);
  return {
    ...product,
    texts,
    media,
    assignments,
    variations,
    bundleItems,
    pricing,
    reviews,
  };
}
