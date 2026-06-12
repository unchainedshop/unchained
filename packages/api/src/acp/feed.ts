import { ProductStatus } from '@unchainedshop/core-products';
import type { Context } from '../context.ts';
import normalizeMediaUrl from '../mcp/utils/normalizeMediaUrl.ts';
import { acpConfig } from './config.ts';
import { ACPError } from './error.ts';

const formatPrice = (amount: number, currencyCode: string, decimals = 2) =>
  `${(amount / 10 ** decimals).toFixed(decimals)} ${currencyCode.toUpperCase()}`;

export const buildACPProductFeed = async (context: Context) => {
  if (!acpConfig.sellerName || !acpConfig.sellerUrl || !acpConfig.productUrlBase) {
    throw new ACPError(
      503,
      'api_error',
      'feed_not_configured',
      'ACP_SELLER_NAME, ACP_SELLER_URL, and ACP_PRODUCT_URL_BASE are required',
    );
  }

  const targetCountries = acpConfig.targetCountries?.length
    ? acpConfig.targetCountries
    : [context.countryCode.toUpperCase()];
  const rows: Record<string, unknown>[] = [];
  const limit = 250;

  for (let offset = 0; ; offset += limit) {
    const products = await context.modules.products.findProducts(
      { includeDrafts: false, limit, offset },
      {},
    );
    if (!products.length) break;

    for (const product of products) {
      const text = await context.modules.products.texts.findLocalizedText({
        productId: product._id,
        locale: context.locale,
      });
      if (!text?.title || !text.description) continue;

      const pricing = await context.services.products.simulateProductPricing({
        product,
        countryCode: context.countryCode,
        currencyCode: context.currencyCode,
        quantity: 1,
        discounts: [],
      });
      const unitPrice = pricing?.unitPrice({ useNetPrice: false });
      if (!unitPrice) continue;

      const currency = await context.modules.currencies.findCurrency({
        isoCode: unitPrice.currencyCode,
      });
      const medias = await context.modules.products.media.findProductMedias({
        productId: product._id,
      });
      const normalizedMedia = await normalizeMediaUrl(medias, context);
      const imageUrl = (normalizedMedia[0] as any)?.file?.url;
      if (!imageUrl) continue;

      const inventory = await context.services.products.simulateProductInventory({ product });
      const knownStock = inventory
        .map(({ quantity }) => quantity)
        .filter((quantity): quantity is number => typeof quantity === 'number');
      const availability = knownStock.length
        ? knownStock.some((quantity) => quantity > 0)
          ? 'in_stock'
          : 'out_of_stock'
        : 'unknown';
      const checkoutEligible = Boolean(
        acpConfig.paymentProviderId &&
        acpConfig.sellerPrivacyPolicy &&
        acpConfig.sellerTerms &&
        availability !== 'out_of_stock',
      );
      const slug = text.slug || product.slugs[0] || product._id;
      const productUrl = `${acpConfig.productUrlBase.replace(/\/$/, '')}/${slug}`;

      rows.push({
        item_id: product._id,
        title: text.title,
        description: text.description,
        url: productUrl,
        image_url: imageUrl,
        ...(normalizedMedia.length > 1
          ? {
              additional_image_urls: normalizedMedia
                .slice(1)
                .map((media) => (media as any).file?.url)
                .filter(Boolean)
                .join(','),
            }
          : {}),
        brand: text.brand || text.vendor || acpConfig.sellerName,
        price: formatPrice(unitPrice.amount, unitPrice.currencyCode, currency?.decimals ?? 2),
        availability,
        is_eligible_search: product.status === ProductStatus.ACTIVE,
        is_eligible_checkout: checkoutEligible,
        seller_name: acpConfig.sellerName,
        seller_url: acpConfig.sellerUrl,
        ...(checkoutEligible
          ? {
              seller_privacy_policy: acpConfig.sellerPrivacyPolicy,
              seller_tos: acpConfig.sellerTerms,
            }
          : {}),
        target_countries: targetCountries,
        store_country: context.countryCode.toUpperCase(),
        group_id: product._id,
        listing_has_variations: Boolean(product.proxy?.assignments?.length),
        mpn: product.warehousing?.sku,
      });
    }

    if (products.length < limit) break;
  }

  return rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : '');
};
