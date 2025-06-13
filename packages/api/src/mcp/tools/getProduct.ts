import { z } from 'zod';
import { Context } from '../../context.js';
import normalizeMediaUrl from './normalizeMediaUrl.js';

/**
 * Zod schema for the get_product tool (as raw object for MCP)
 */
export const GetProductSchema = {
  productId: z.string().optional().describe('Product ID for lookup'),
  slug: z.string().optional().describe('Product slug for lookup'),
  sku: z.string().optional().describe('Product SKU for lookup'),
};

/**
 * Zod object schema for type inference and validation
 */
export const GetProductZodSchema = z
  .object(GetProductSchema)
  .refine(
    (data) => data.productId || data.slug || data.sku,
    'At least one of productId, slug, or sku must be provided',
  );

/**
 * Interface for the get_product tool parameters
 */
export type GetProductParams = z.infer<typeof GetProductZodSchema>;

/**
 * Implementation of the get_product tool
 */
export async function getProductHandler(context: Context, params: GetProductParams) {
  const { productId, slug, sku } = params;

  try {
    // Find the product
    const product = await context.modules.products.findProduct({
      productId,
      slug,
      sku,
    });

    if (!product) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Product not found with ${productId ? `ID: ${productId}` : slug ? `slug: ${slug}` : `SKU: ${sku}`}`,
          },
        ],
      };
    }

    // Get product texts for localization
    const productTexts = await context.loaders.productTextLoader.load({
      productId: product._id,
      locale: context.locale,
    });

    // Get media
    const productMedias = await context.modules.products.media.findProductMedias({
      productId: product._id,
    });
    const media = await normalizeMediaUrl(productMedias, context);

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

    // Get variations if it's a configurable product
    const variations = await context.modules.products.variations.findProductVariations({
      productId: product._id,
    });

    // Get bundle items if it's a bundle product
    // const bundleItems =
    //   product.type === 'BUNDLE_PRODUCT'
    //     ? await context.modules.products.bundleItems.findBundleItems({
    //         productId: product._id,
    //       })
    //     : [];

    // Get assortment memberships
    // const assortmentLinks = await context.modules.assortments.links.findLinks({
    //   productId: product._id,
    // });

    // Get reviews count
    const reviewsCount = await context.modules.products.reviews.count({
      productId: product._id,
    });
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            product: {
              ...product,
              texts: productTexts,
              media,
              pricing,
              variations,
              reviewsCount,
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
          text: `Error getting product: ${(error as Error).message}`,
        },
      ],
    };
  }
}
