import { z } from 'zod';
import { Context } from '../../context.js';
import { escapeHtml } from '../utils/html.js';

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
    // Build selector for product lookup
    let selector: any = {};
    
    if (productId) {
      selector._id = productId;
    } else if (slug) {
      selector.slugs = slug;
    } else if (sku) {
      selector['warehousing.sku'] = sku;
    }

    // Find the product
    const product = await context.modules.products.findProduct(selector);
    
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
    const media = await context.modules.products.media.findProductMedias({
      productId: product._id,
    });

    // Get pricing information
    let pricing = null;
    try {
      pricing = await context.modules.products.price.getPrice({
        productId: product._id,
        currency: 'CHF', // TODO: Get from context or make configurable
        useNetPrice: false,
      });
    } catch (error) {
      // Pricing might not be available for all products
      console.warn('Pricing not available for product:', product._id);
    }

    // Get variations if it's a configurable product
    const variations = await context.modules.products.variations.findProductVariations({
      productId: product._id,
    });

    // Get bundle items if it's a bundle product
    const bundleItems = product.type === 'BUNDLE_PRODUCT' 
      ? await context.modules.products.bundleItems.findBundleItems({
          productId: product._id,
        })
      : [];

    // Get assortment memberships
    const assortmentLinks = await context.modules.assortments.links.findLinks({
      productId: product._id,
    });

    // Get reviews count
    const reviewsCount = await context.modules.products.reviews.count({
      productId: product._id,
    });

    // Generate rich HTML visualization
    const htmlContent = generateProductDetailHTML(product, {
      productTexts,
      media,
      pricing,
      variations,
      bundleItems,
      assortmentLinks,
      reviewsCount,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            product,
            productTexts,
            media,
            pricing,
            variations,
            bundleItems,
            assortmentLinks,
            reviewsCount,
          }, null, 2),
        },
        {
          type: 'resource' as const,
          resource: {
            text: htmlContent,
            uri: `data:text/html;charset=UTF-8,${encodeURIComponent(htmlContent)}`,
            mimeType: 'text/html',
          },
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

/**
 * Generate rich HTML visualization for product details
 */
function generateProductDetailHTML(
  product: any,
  data: {
    productTexts?: any;
    media?: any[];
    pricing?: any;
    variations?: any[];
    bundleItems?: any[];
    assortmentLinks?: any[];
    reviewsCount?: number;
  },
): string {
  const { productTexts, media, pricing, variations, bundleItems, assortmentLinks, reviewsCount } = data;

  // Get primary information
  const title = productTexts?.title || product.title || 'Untitled Product';
  const subtitle = productTexts?.subtitle || '';
  const description = productTexts?.description || '';
  const sku = product.warehousing?.sku || 'N/A';
  const status = product.status || 'DRAFT';
  const type = product.type || 'SIMPLE_PRODUCT';

  // Status color mapping
  const statusColor = 
    status === 'ACTIVE' ? '#28a745' : 
    status === 'DRAFT' ? '#ffc107' : 
    status === 'DELETED' ? '#dc3545' : '#6c757d';

  // Get primary image
  const primaryImage = media?.find(m => m.tags?.includes('hero')) || media?.[0];
  const primaryImageUrl = primaryImage?.file?.url || primaryImage?.url;

  // Format price
  const priceDisplay = pricing?.price 
    ? `${(pricing.price.amount / 100).toFixed(2)} ${pricing.price.currency}`
    : 'Price not available';

  // Format dates
  const createdDate = product.created ? new Date(product.created).toLocaleDateString() : 'N/A';
  const updatedDate = product.updated ? new Date(product.updated).toLocaleDateString() : 'N/A';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Product Details: ${escapeHtml(title)}</title>
</head>
<body>
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui; max-width: 800px; margin: 0 auto; padding: 20px;">
    
    <!-- Main Product Card -->
    <div style="background: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 16px; overflow: hidden;">
      <div style="padding: 20px; border-bottom: 1px solid #e9ecef;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <h2 style="margin: 0; color: #343a40; font-size: 24px;">${escapeHtml(title)}</h2>
          <span style="padding: 6px 12px; border-radius: 12px; font-size: 14px; font-weight: 500; background: ${statusColor}; color: white;">${status}</span>
        </div>
        ${subtitle ? `<p style="margin: 0; color: #6c757d; font-size: 16px;">${escapeHtml(subtitle)}</p>` : ''}
        <div style="margin-top: 12px; display: flex; gap: 16px; font-size: 14px; color: #6c757d; flex-wrap: wrap;">
          <span><strong>ID:</strong> ${escapeHtml(product._id?.toString() || 'N/A')}</span>
          <span><strong>SKU:</strong> ${escapeHtml(sku)}</span>
          <span><strong>Type:</strong> ${escapeHtml(type)}</span>
        </div>
      </div>
      
      <!-- Product Image -->
      ${primaryImageUrl ? `
        <div style="padding: 20px; text-align: center; background: #f8f9fa;">
          <img src="${escapeHtml(primaryImageUrl)}" 
               style="max-width: 100%; max-height: 300px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" 
               onerror="this.style.display='none'; this.nextElementSibling.style.display='block'" />
          <div style="display: none; padding: 60px; color: #6c757d; font-size: 18px;">Image not available</div>
        </div>
      ` : `
        <div style="padding: 60px; text-align: center; background: #f8f9fa; color: #6c757d; font-size: 18px;">
          No image available
        </div>
      `}
    </div>
    
    <!-- Information Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
      
      <!-- Basic Information -->
      <div style="background: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 20px;">
        <h3 style="margin: 0 0 16px 0; color: #0066cc; font-size: 18px;">Basic Information</h3>
        <div style="space-y: 8px;">
          <div style="margin-bottom: 8px;">
            <span style="font-weight: 500; color: #343a40;">Sequence:</span>
            <span style="color: #6c757d; margin-left: 8px;">${product.sequence || 'N/A'}</span>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="font-weight: 500; color: #343a40;">Created:</span>
            <span style="color: #6c757d; margin-left: 8px;">${createdDate}</span>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="font-weight: 500; color: #343a40;">Updated:</span>
            <span style="color: #6c757d; margin-left: 8px;">${updatedDate}</span>
          </div>
          ${product.tags?.length ? `
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 500; color: #343a40;">Tags:</span>
              <div style="margin-top: 4px;">
                ${product.tags.map((tag: string) => 
                  `<span style="background: #e9ecef; padding: 2px 6px; border-radius: 3px; margin-right: 4px; font-size: 12px;">${escapeHtml(tag)}</span>`
                ).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
      
      <!-- Pricing Information -->
      <div style="background: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 20px;">
        <h3 style="margin: 0 0 16px 0; color: #0066cc; font-size: 18px;">Pricing</h3>
        <div style="space-y: 8px;">
          <div style="margin-bottom: 8px;">
            <span style="font-weight: 500; color: #343a40;">Current Price:</span>
            <span style="color: #6c757d; margin-left: 8px;">${escapeHtml(priceDisplay)}</span>
          </div>
          ${pricing?.taxIncluded !== undefined ? `
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 500; color: #343a40;">Tax Included:</span>
              <span style="color: #6c757d; margin-left: 8px;">${pricing.taxIncluded ? 'Yes' : 'No'}</span>
            </div>
          ` : ''}
          ${variations?.length ? `
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 500; color: #343a40;">Variations:</span>
              <span style="color: #6c757d; margin-left: 8px;">${variations.length} variation(s)</span>
            </div>
          ` : ''}
        </div>
      </div>
    </div>

    ${description ? `
      <!-- Description -->
      <div style="background: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 20px; margin-bottom: 16px;">
        <h3 style="margin: 0 0 16px 0; color: #0066cc; font-size: 18px;">Description</h3>
        <div style="color: #343a40; line-height: 1.6;">${escapeHtml(description)}</div>
      </div>
    ` : ''}

    ${media?.length > 1 ? `
      <!-- Media Gallery -->
      <div style="background: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 20px; margin-bottom: 16px;">
        <h3 style="margin: 0 0 16px 0; color: #0066cc; font-size: 18px;">Media Gallery (${media.length} items)</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px;">
          ${media.map((item: any) => `
            <div style="position: relative;">
              ${item.file?.url || item.url ? `
                <img src="${escapeHtml(item.file?.url || item.url)}" 
                     style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid #e9ecef;"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'" />
                <div style="display: none; width: 100%; height: 120px; background: #f8f9fa; border-radius: 4px; align-items: center; justify-content: center; color: #6c757d; font-size: 12px;">No preview</div>
              ` : `
                <div style="width: 100%; height: 120px; background: #f8f9fa; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #6c757d; font-size: 12px;">No preview</div>
              `}
              ${item.tags?.length ? `
                <div style="position: absolute; bottom: 4px; left: 4px; background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">
                  ${item.tags.slice(0, 2).join(', ')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    ${bundleItems?.length ? `
      <!-- Bundle Items -->
      <div style="background: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 20px; margin-bottom: 16px;">
        <h3 style="margin: 0 0 16px 0; color: #0066cc; font-size: 18px;">Bundle Items (${bundleItems.length})</h3>
        <div style="space-y: 8px;">
          ${bundleItems.map((item: any) => `
            <div style="padding: 8px; background: #f8f9fa; border-radius: 4px; margin-bottom: 8px;">
              <div style="font-weight: 500; color: #343a40;">${escapeHtml(item.product?.title || 'Bundle Item')}</div>
              <div style="font-size: 12px; color: #6c757d;">Quantity: ${item.quantity || 1}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    ${variations?.length ? `
      <!-- Variations -->
      <div style="background: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 20px; margin-bottom: 16px;">
        <h3 style="margin: 0 0 16px 0; color: #0066cc; font-size: 18px;">Product Variations (${variations.length})</h3>
        <div style="space-y: 8px;">
          ${variations.map((variation: any) => `
            <div style="padding: 8px; background: #f8f9fa; border-radius: 4px; margin-bottom: 8px;">
              <div style="font-weight: 500; color: #343a40;">${escapeHtml(variation.key || 'Variation')}</div>
              <div style="font-size: 12px; color: #6c757d;">Type: ${variation.type || 'N/A'}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Additional Information -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      
      <!-- Technical Details -->
      <div style="background: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 20px;">
        <h3 style="margin: 0 0 16px 0; color: #0066cc; font-size: 18px;">Technical Details</h3>
        <div style="space-y: 8px;">
          <div style="margin-bottom: 8px;">
            <span style="font-weight: 500; color: #343a40;">Reviews:</span>
            <span style="color: #6c757d; margin-left: 8px;">${reviewsCount || 0} review(s)</span>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="font-weight: 500; color: #343a40;">Assortments:</span>
            <span style="color: #6c757d; margin-left: 8px;">${assortmentLinks?.length || 0} membership(s)</span>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="font-weight: 500; color: #343a40;">Media Count:</span>
            <span style="color: #6c757d; margin-left: 8px;">${media?.length || 0} item(s)</span>
          </div>
        </div>
      </div>

      <!-- Localization -->
      <div style="background: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 20px;">
        <h3 style="margin: 0 0 16px 0; color: #0066cc; font-size: 18px;">Localization</h3>
        <div style="space-y: 8px;">
          <div style="margin-bottom: 8px;">
            <span style="font-weight: 500; color: #343a40;">Current Locale:</span>
            <span style="color: #6c757d; margin-left: 8px;">${escapeHtml(productTexts?.locale || 'N/A')}</span>
          </div>
          ${productTexts?.vendor ? `
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 500; color: #343a40;">Vendor:</span>
              <span style="color: #6c757d; margin-left: 8px;">${escapeHtml(productTexts.vendor)}</span>
            </div>
          ` : ''}
          ${productTexts?.brand ? `
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 500; color: #343a40;">Brand:</span>
              <span style="color: #6c757d; margin-left: 8px;">${escapeHtml(productTexts.brand)}</span>
            </div>
          ` : ''}
        </div>
      </div>
    </div>

  </div>
</body>
</html>`;
}