import { ProductTypes } from '@unchainedshop/core-products';
import { Context } from '../../context.js';
import normalizeMediaUrl from './normalizeMediaUrl.js';

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
  if (product.type === ProductTypes.ConfigurableProduct && product?.proxy?.assignments?.length) {
    variations = await context.modules.products.variations.findProductVariations({
      productId: product._id,
    });
    assignments = await Promise.all(
      product?.proxy?.assignments?.map(async (assignment) => {
        const product = await loaders.productLoader.load({
          productId: assignment.productId,
        });
        const productMedias = await modules.products.media.findProductMedias({
          productId: assignment.productId,
        });
        const media = await normalizeMediaUrl(productMedias, context);
        const texts = await loaders.productTextLoader.load({
          productId: assignment.productId,
          locale,
        });
        return {
          assignment: {
            ...assignment,
            product: {
              ...product,
              media,
              texts,
            },
          },
        };
      }),
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
            texts,
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
    console.warn('Pricing not available for product:', product._id);
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
  };
}
