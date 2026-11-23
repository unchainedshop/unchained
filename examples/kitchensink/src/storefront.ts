import { readFileSync } from 'node:fs';
import { resolveDefaultContext, type Context } from '@unchainedshop/api';
import { pluginRegistry, type PluginHttpRequestContext } from '@unchainedshop/core';
import { createCatalogPriceFilterPlugin } from '@unchainedshop/plugins/filters/catalog-price';
import {
  createProductSearchTool,
  createStorefrontMcpPlugin,
  searchStorefrontProducts,
  type ProductUrlBuilder,
} from '@unchainedshop/plugins/mcp/storefront';

const rootUrl = () => process.env.ROOT_URL || 'http://localhost:4010';

const productUrl: ProductUrlBuilder = ({ productId, locale, countryCode }) =>
  `${rootUrl()}/shop/products/${productId}?locale=${locale.language}-${countryCode}`;

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);

async function productPage(request: Request, context: PluginHttpRequestContext) {
  const guest = {
    ...context,
    userId: undefined,
    user: undefined,
    impersonatorId: undefined,
  } as unknown as Context;
  const locale = new URL(request.url).searchParams.get('locale') || undefined;
  const market = await resolveDefaultContext(
    { acceptLang: locale, acceptCountry: locale?.split('-')[1] },
    guest,
  );
  const result = await searchStorefrontProducts(
    guest,
    { productIds: [context.params.productId], limit: 1 },
    market,
    productUrl,
  );
  const [product] = result?.products || [];
  if (!product) return new Response('Product not found', { status: 404 });

  const price = product.price
    ? [product.price.formatted, product.price.maxPrice?.formatted].filter(Boolean).join(' – ')
    : 'Price unavailable';
  return new Response(
    `<!doctype html>
<html lang="${market.locale.language}">
<meta charset="utf-8">
<title>${escapeHtml(product.title)}</title>
<main style="font-family: system-ui; max-width: 40rem; margin: 2rem auto">
  ${product.image ? `<img src="${escapeHtml(product.image)}" alt="" style="width: 100%">` : ''}
  ${product.brand ? `<p>${escapeHtml(product.brand)}</p>` : ''}
  <h1>${escapeHtml(product.title)}</h1>
  ${product.description ? `<p>${escapeHtml(product.description)}</p>` : ''}
  <p><strong>${escapeHtml(price)}</strong></p>
</main>`,
    { headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}

export function registerStorefront() {
  pluginRegistry.register(
    createCatalogPriceFilterPlugin({
      filters: {
        price_ch: { countryCode: 'CH', currencyCode: 'CHF' },
        price_us: { countryCode: 'US', currencyCode: 'USD' },
      },
    }),
  );
  pluginRegistry.register(
    createStorefrontMcpPlugin({
      shopName: 'Unchained Kitchensink',
      shopUrl: rootUrl(),
      tools: [
        createProductSearchTool({
          productUrl,
          ui: {
            uri: 'ui://kitchensink/product-cards.html',
            html: readFileSync(new URL('../mcp/product-cards.html', import.meta.url), 'utf8'),
            csp: { resourceDomains: [new URL(rootUrl()).origin] },
          },
        }),
      ],
    }),
  );
  pluginRegistry.register({
    key: 'kitchensink.storefront.product-page',
    label: 'Kitchensink product page',
    version: '1.0.0',
    routes: [{ path: '/shop/products/:productId', method: 'GET', handler: productPage }],
  });
}
