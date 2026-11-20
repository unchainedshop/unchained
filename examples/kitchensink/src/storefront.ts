import { readFileSync } from 'node:fs';
import { resolveDefaultContext } from '@unchainedshop/api';
import { pluginRegistry, type PluginHttpRequestContext } from '@unchainedshop/core';
import {
  createProductSearchTool,
  createStorefrontMcpPlugin,
  createStorefrontToolContext,
  searchStorefrontProducts,
} from '@unchainedshop/plugins/mcp/storefront';

const escapeHtml = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

async function productPage(request: Request, context: PluginHttpRequestContext) {
  const requestedLocale = new URL(request.url).searchParams.get('locale');
  let pageContext = context;
  if (requestedLocale) {
    let requested: Intl.Locale;
    try {
      requested = new Intl.Locale(requestedLocale);
    } catch {
      return new Response('Invalid locale', { status: 400 });
    }
    const market =
      requested.baseName === context.locale.baseName
        ? context
        : await resolveDefaultContext(
            { acceptLang: requested.baseName, acceptCountry: requested.region },
            context,
          );
    const marketHeaders = new Headers({
      'accept-language': market.locale.baseName,
      'x-shop-country': market.countryCode,
    });
    pageContext = { ...context, ...market, getHeader: (name) => marketHeaders.get(name) ?? undefined };
  }

  const result = await searchStorefrontProducts(
    createStorefrontToolContext(pageContext),
    { product_id: context.params.productId },
    () => request.url,
  );
  const product = result?.products[0];
  if (!product) return new Response('Product not found', { status: 404 });

  const title = escapeHtml(product.name);
  const price = product.formatted_price
    ? escapeHtml(product.formatted_price) + (product.is_net_price ? ' excl. tax' : '')
    : 'Price unavailable';
  const html = `<!doctype html><html lang="${pageContext.locale.baseName}"><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
    <style>body{max-width:38rem;margin:12vh auto;padding:0 1.5rem;font:1.125rem/1.5 system-ui}h1{line-height:1.1}</style>
    <main>${product.brand ? `<p>${escapeHtml(product.brand)}</p>` : ''}<h1>${title}</h1><p><strong>${price}</strong></p>
    ${product.description ? `<p>${escapeHtml(product.description)}</p>` : ''}</main></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export function registerStorefront(shopUrl: string) {
  pluginRegistry.register({
    key: 'kitchensink.product-pages',
    label: 'Kitchensink product pages',
    version: '1.0.0',
    routes: [{ method: 'GET', path: '/shop/products/:productId', handler: productPage }],
  });
  pluginRegistry.register(
    createStorefrontMcpPlugin({
      shopName: 'Unchained Kitchensink',
      tools: [
        createProductSearchTool({
          ui: {
            resourceUri: 'ui://unchained/storefront-product-cards-v2.html',
            title: 'Product search results',
            html: readFileSync(new URL('../mcp/product-cards.html', import.meta.url), 'utf8'),
          },
          productUrl: ({ productId, locale }) => {
            const url = new URL(`/shop/products/${encodeURIComponent(productId)}`, shopUrl);
            url.searchParams.set('locale', locale.baseName);
            return url.href;
          },
        }),
      ],
    }),
  );
}
