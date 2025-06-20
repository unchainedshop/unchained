import { ProductTypes } from '@unchainedshop/core-products';
import { Context } from '../../context.js';
import normalizeMediaUrl from './normalizeMediaUrl.js';

export async function getNormalizedProductDetails(productId: string, context: Context) {
  const { modules, locale, loaders } = context;

  const product = await modules.products.findProduct({ productId });

  const texts = await loaders.productTextLoader.load({
    productId,
    locale,
  });
  let variations = [];
  if (product.type === ProductTypes.ConfigurableProduct)
    variations = await context.modules.products.variations.findProductVariations({
      productId: product._id,
    });

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
    variations,
    pricing,
  };
}
