import type { Product, ProductAssignment } from '@unchainedshop/core-products';
import { acpConfig, type ACPContext } from './config.ts';
import { ACPError } from './error.ts';

const productURL = (product: Product, slug?: string) =>
  `${acpConfig.productUrlBase!.replace(/\/$/, '')}/${slug || product.slugs[0] || product._id}`;

const seller = () => ({
  name: acpConfig.sellerName,
  links: [
    ...(acpConfig.sellerPrivacyPolicy
      ? [
          {
            type: 'privacy_policy',
            title: 'Privacy policy',
            url: acpConfig.sellerPrivacyPolicy,
          },
        ]
      : []),
    ...(acpConfig.sellerTerms
      ? [
          {
            type: 'terms_of_service',
            title: 'Terms of service',
            url: acpConfig.sellerTerms,
          },
        ]
      : []),
  ],
});

const mediaForProduct = async (product: Product, context: ACPContext, altText: string) => {
  const medias = await context.modules.products.media.findProductMedias({
    productId: product._id,
  });
  const resolved = await context.services.files.resolveMediaFiles(medias);
  return resolved.map(({ file }) => ({ type: 'image', url: file.url, alt_text: altText }));
};

const availabilityForProduct = async (product: Product, context: ACPContext) => {
  try {
    const inventory = await context.services.products.simulateProductInventory({ product });
    const quantities = (inventory || [])
      .map(({ quantity }: any) => quantity)
      .filter((quantity: unknown): quantity is number => typeof quantity === 'number');
    if (!quantities.length) return { available: true, status: 'unknown' };
    const available = quantities.some((quantity) => quantity > 0);
    return { available, status: available ? 'in_stock' : 'out_of_stock' };
  } catch {
    return { available: true, status: 'unknown' };
  }
};

const variantForProduct = async (
  product: Product,
  assignment: ProductAssignment | undefined,
  context: ACPContext,
) => {
  const text = await context.modules.products.texts.findLocalizedText({
    productId: product._id,
    locale: context.locale,
  });
  const title = text?.title || product.warehousing?.sku || product._id;
  const pricing = await context.services.products
    .simulateProductPricing({
      product,
      countryCode: context.countryCode,
      currencyCode: context.currencyCode,
      quantity: 1,
      discounts: [],
    })
    .catch(() => null);
  const unitPrice = pricing?.unitPrice({ useNetPrice: false });

  return {
    id: product._id,
    title,
    ...(text?.description ? { description: { plain: text.description } } : {}),
    url: productURL(product, text?.slug),
    ...(product.warehousing?.sku ? { barcodes: [{ type: 'SKU', value: product.warehousing.sku }] } : {}),
    ...(unitPrice
      ? {
          price: {
            amount: unitPrice.amount,
            currency: unitPrice.currencyCode.toUpperCase(),
          },
        }
      : {}),
    availability: await availabilityForProduct(product, context),
    condition: ['new'],
    ...(assignment
      ? {
          variant_options: Object.entries(assignment.vector).map(([name, value]) => ({
            name,
            value,
          })),
        }
      : {}),
    media: await mediaForProduct(product, context, title),
    seller: seller(),
  };
};

const feedProduct = async (product: Product, context: ACPContext) => {
  const text = await context.modules.products.texts.findLocalizedText({
    productId: product._id,
    locale: context.locale,
  });
  const title = text?.title || product._id;
  const assignedProducts = product.proxy?.assignments?.length
    ? await context.modules.products.proxyProducts(product, [], { includeInactive: false })
    : [product];
  const assignments = new Map(
    (product.proxy?.assignments || []).map((assignment) => [assignment.productId, assignment]),
  );
  const variants = await Promise.all(
    assignedProducts.map((variant) => variantForProduct(variant, assignments.get(variant._id), context)),
  );

  return {
    id: product._id,
    title,
    ...(text?.description ? { description: { plain: text.description } } : {}),
    url: productURL(product, text?.slug),
    media: await mediaForProduct(product, context, title),
    variants,
  };
};

export const buildACPProductFeed = async (context: ACPContext) => {
  if (!acpConfig.sellerName || !acpConfig.productUrlBase) {
    throw new ACPError(
      503,
      'service_unavailable',
      'feed_not_configured',
      'ACP_SELLER_NAME and ACP_PRODUCT_URL_BASE are required',
    );
  }

  const limit = 250;
  const rows = (async function* () {
    for (let offset = 0; ; offset += limit) {
      const products = await context.modules.products.findProducts(
        { includeDrafts: false, limit, offset },
        {},
      );
      if (!products.length) return;
      const page = await Promise.all(products.map((product) => feedProduct(product, context)));
      for (const row of page) yield `${JSON.stringify(row)}\n`;
      if (products.length < limit) return;
    }
  })();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const next = await rows.next();
        if (next.done) controller.close();
        else controller.enqueue(encoder.encode(next.value));
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel() {
      await rows.return?.();
    },
  });
};
