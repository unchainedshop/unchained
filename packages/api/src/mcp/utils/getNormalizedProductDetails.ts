import { ProductTypes } from '@unchainedshop/core-products';
import { Context } from '../../context.js';
import normalizeMediaUrl from './normalizeMediaUrl.js';
import { createLogger } from '@unchainedshop/logger';
import normalizeProxyAssignments from './normalizeProxyAssignments.js';

const logger = createLogger('unchained:api:mcp');
const removeUnnecessaryFields = ({
  texts,
  media,
  assignments,
  variations,
  bundleItems,
  pricing,
  reviews,
  ...product
}) => {
  return {
    ...product,
    texts: { ...(texts || {}), description: null },
    media,
    assignments,
    variations,
    bundleItems,
    pricing,
    reviews,
  };
};

export async function getNormalizedProductDetails(productId: string, context: Context) {
  const { modules, locale, loaders } = context;
  const product = await modules.products.findProduct({ productId });

  if (!product) return null;

  const texts = await loaders.productTextLoader.load({
    productId,
    locale,
  });
  let variations = [];
  let bundleItems = [];
  let assignments = [];
  const reviews = await modules.products.reviews.findProductReviews({
    productId,
  });

  if (product.type === ProductTypes.ConfigurableProduct) {
    variations = await context.modules.products.variations.findProductVariations({
      productId: product?._id,
    });
    assignments = await Promise.all(
      (product?.proxy?.assignments || [])?.map(async (assignment) =>
        normalizeProxyAssignments(assignment, context),
      ),
    );
  }

  if (product.type === ProductTypes.BundleProduct) {
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
            texts: {
              ...texts,
              description: null,
            },
          },
          ...item,
        };
      }),
    );
  }

  // Get pricing information
  let pricing = null;
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
  return removeUnnecessaryFields({
    ...product,
    texts,
    media,
    assignments,
    variations,
    bundleItems,
    pricing,
    reviews,
  });
}
