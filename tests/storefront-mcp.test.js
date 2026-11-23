import assert from 'node:assert';
import test from 'node:test';
import {
  setupDatabase,
  getServerBaseUrl,
  createAnonymousGraphqlFetch,
  createLoggedInGraphqlFetch,
} from './helpers.js';
import { resolveDefaultContext } from '@unchainedshop/api';
import { createProductSearchTool } from '@unchainedshop/plugins/mcp/storefront';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import { seedStorefrontCatalog } from './seeds/storefront.js';

const lifetime = Number(process.env.UNCHAINED_FILTER_CACHE_TTL_MS || 60_000);

let baseUrl;
let db;
let filterIds;

const parseMcpResponse = async (response) => {
  const text = await response.text();
  if ((response.headers.get('content-type') || '').includes('text/event-stream')) {
    const dataLines = text.split('\n').filter((line) => line.startsWith('data:'));
    return JSON.parse(dataLines[dataLines.length - 1].slice(5));
  }
  return text ? JSON.parse(text) : null;
};

const storefront = async (method, params = {}, headers = {}) =>
  parseMcpResponse(
    await fetch(`${baseUrl}/mcp/storefront`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        ...headers,
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    }),
  );

const searchTool = async () =>
  (await storefront('tools/list')).result.tools.find(({ name }) => name === 'search_products');

const searchProducts = async (args, { meta, headers } = {}) =>
  (
    await storefront(
      'tools/call',
      { name: 'search_products', arguments: args, ...(meta && { _meta: meta }) },
      headers,
    )
  ).result;

const adminGraphqlFetch = createLoggedInGraphqlFetch();

const ids = (result) => result.structuredContent.products.map(({ id }) => id);

test.describe('Storefront MCP', () => {
  test.before(async () => {
    [db] = await setupDatabase();
    baseUrl = getServerBaseUrl();
    filterIds = await seedStorefrontCatalog(db, adminGraphqlFetch);
  });

  test('discovers the configured inputs, the shop sort orders and the product cards', async () => {
    const tool = await searchTool();
    const { properties } = tool.inputSchema;
    assert.deepStrictEqual(properties.brand.enum, ['Nordlicht', 'Alpenwerk']);
    assert.match(properties.price_ch.description, /CHF in Rappen.*lower:upper/);
    assert.match(properties.price_de.description, /EUR in Cent/);
    assert.deepStrictEqual(properties.sort.enum, ['meta_rating_DESC']);
    assert.strictEqual(tool.inputSchema.additionalProperties, false);
    assert.match(tool.description, /default language and only explain this schema/);
    assert.deepStrictEqual(Object.keys(tool.outputSchema.properties), [
      'market',
      'totalCount',
      'products',
    ]);
    assert.deepStrictEqual(tool.annotations, {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    });
    assert.strictEqual(tool._meta.ui.resourceUri, 'ui://test/product-cards.html');

    const { result } = await storefront('resources/read', { uri: 'ui://test/product-cards.html' });
    assert.strictEqual(result.contents[0].mimeType, 'text/html;profile=mcp-app');
  });

  test('follows changed options and deactivated filters after the filter cache lifetime', async (t) => {
    const { now } = Date;
    let offset = 0;
    Date.now = () => now() + offset;
    t.after(() => {
      Date.now = now;
      resolveDefaultContext.clear();
    });
    const expire = () => {
      offset += lifetime + 1;
    };
    const graphql = (query) => adminGraphqlFetch({ query, variables: { filterId: filterIds.brand } });

    await searchTool();
    await graphql(`
      mutation ($filterId: ID!) {
        createFilterOption(filterId: $filterId, option: "Bergwind") {
          _id
        }
      }
    `);
    assert.ok(!(await searchTool()).inputSchema.properties.brand.enum.includes('Bergwind'));
    expire();
    assert.ok((await searchTool()).inputSchema.properties.brand.enum.includes('Bergwind'));

    await graphql(`
      mutation ($filterId: ID!) {
        updateFilter(filterId: $filterId, filter: { isActive: false }) {
          _id
        }
      }
    `);
    expire();
    assert.ok(!(await searchTool()).inputSchema.properties.brand);
    const obsolete = await searchProducts({ brand: 'Nordlicht' });
    assert.strictEqual(obsolete.isError, true);
    assert.match(obsolete.content[0].text, /brand.*accepted inputs: price_ch, price_de, query/);

    await graphql(`
      mutation ($filterId: ID!) {
        updateFilter(filterId: $filterId, filter: { isActive: true }) {
          _id
        }
      }
    `);
    await graphql(`
      mutation ($filterId: ID!) {
        removeFilterOption(filterId: $filterId, filterOptionValue: "Bergwind") {
          _id
        }
      }
    `);
    expire();
    assert.deepStrictEqual((await searchTool()).inputSchema.properties.brand.enum, [
      'Nordlicht',
      'Alpenwerk',
    ]);
  });

  test('rejects built-in and invalid input names when the shop sets up the tool', () => {
    const setUp = (inputs) => createProductSearchTool({ productUrl: () => '', inputs });
    assert.throws(() => setUp({ query: 'meta.brand' }), /Invalid search inputs query/);
    assert.throws(() => setUp({ 'meta.brand': 'meta.brand' }), /Invalid search inputs meta\.brand/);
    assert.ok(setUp({ brand: 'meta.brand' }));
  });

  test('searches the market the host hints at', async () => {
    const german = await searchProducts(
      { price_de: '0:5000' },
      { meta: { 'openai/locale': 'en-US', 'openai/userLocation': { country: 'DE' } } },
    );
    assert.deepStrictEqual(german.structuredContent.market, {
      country: 'DE',
      language: 'en',
      currency: 'EUR',
    });
    assert.ok(!ids(german).includes('sf-mini-8') && ids(german).includes('sf-at-limit'));

    const withoutLocation = await searchProducts({}, { meta: { 'openai/locale': 'en-US' } });
    assert.strictEqual(withoutLocation.structuredContent.market.country, 'CH');

    const headerWins = await searchProducts(
      {},
      { meta: { 'openai/userLocation': { country: 'DE' } }, headers: { 'x-shop-country': 'CH' } },
    );
    assert.strictEqual(headerWins.structuredContent.market.country, 'CH');

    const unknownCountry = await searchProducts({}, { headers: { 'x-shop-country': 'ZZ' } });
    assert.strictEqual(unknownCountry.structuredContent.market.country, 'CH');
  });

  test('rejects the price input of another market and names the right one', async () => {
    const result = await searchProducts(
      { price_ch: '0:5000' },
      { meta: { 'openai/userLocation': { country: 'DE' } } },
    );
    assert.strictEqual(result.isError, true);
    assert.match(result.content[0].text, /price_ch does not apply to the DE market.*price_de/);
  });

  test('returns the products of an anonymous GraphQL search with market prices', async () => {
    const result = await searchProducts({ brand: 'Nordlicht', price_ch: '0:5000' });
    const { data } = await createAnonymousGraphqlFetch()({
      query: /* GraphQL */ `
        query {
          searchProducts(
            filterQuery: [
              { key: "meta.brand", value: "Nordlicht" }
              { key: "price_ch", value: "0:5000" }
            ]
          ) {
            products(limit: 20) {
              _id
            }
          }
        }
      `,
      headers: { 'x-shop-country': 'CH' },
    });
    assert.deepStrictEqual(
      ids(result),
      data.searchProducts.products.map(({ _id }) => _id),
    );
    assert.deepStrictEqual(ids(result).sort(), ['sf-ch-only', 'sf-mini-8']);

    const mini8 = result.structuredContent.products.find(({ id }) => id === 'sf-mini-8');
    assert.deepStrictEqual(mini8.price, {
      amount: 3900,
      formatted: 'CHF\u00a039.00',
      currency: 'CHF',
      isNetPrice: false,
    });
    assert.strictEqual(mini8.brand, 'Nordlicht');
    assert.strictEqual(mini8.url, 'https://shop.example.com/de-CH/products/sf-mini-8');
    assert.deepStrictEqual(JSON.parse(result.content[0].text), result.structuredContent);

    const configurable = (await searchProducts({ product_ids: ['sf-configurable'] })).structuredContent
      .products[0];
    assert.deepStrictEqual(
      [configurable.price.amount, configurable.price.maxPrice.amount],
      [3000, 9000],
    );
  });

  test('formats prices with the decimals of the market currency', async () => {
    await db
      .collection('currencies')
      .insertOne({ _id: 'kwd', isoCode: 'KWD', isActive: true, decimals: 3 });
    await db
      .collection('countries')
      .insertOne({ _id: 'kw', isoCode: 'KW', isActive: true, defaultCurrencyCode: 'KWD' });
    await db.collection('products').updateOne(
      { _id: 'sf-mini-8' },
      {
        $push: {
          'commerce.pricing': {
            countryCode: 'KW',
            currencyCode: 'KWD',
            amount: 12345,
            minQuantity: 0,
            isTaxable: true,
            isNetPrice: false,
          },
        },
      },
    );
    const result = await searchProducts(
      { product_ids: ['sf-mini-8'] },
      { meta: { 'openai/locale': 'en-US', 'openai/userLocation': { country: 'KW' } } },
    );
    assert.deepStrictEqual(result.structuredContent.products[0].price, {
      amount: 12345,
      formatted: 'KWD\u00a012.345',
      currency: 'KWD',
      isNetPrice: false,
    });
  });

  test('pages through results and selects earlier results by ID', async () => {
    const all = await searchProducts({ brand: 'Nordlicht' });
    const page = await searchProducts({ brand: 'Nordlicht', offset: 1, limit: 1 });
    assert.strictEqual(page.structuredContent.totalCount, all.structuredContent.totalCount);
    assert.deepStrictEqual(ids(page), ids(all).slice(1, 2));

    assert.deepStrictEqual(ids(await searchProducts({ product_ids: ['sf-mini-8'] })), ['sf-mini-8']);
  });

  test('keeps drafts and products the shop hides out of the results, also for admins', async () => {
    const admin = { authorization: ADMIN_TOKEN };
    const selected = await searchProducts(
      { product_ids: ['sf-draft', 'sf-hidden', 'sf-variant-draft'] },
      { headers: admin },
    );
    assert.deepStrictEqual(ids(selected), []);
    const browsed = ids(await searchProducts({ brand: 'Nordlicht', limit: 100 }, { headers: admin }));
    assert.ok(!browsed.includes('sf-draft') && !browsed.includes('sf-hidden'));
  });

  test('searches as the signed-in caller, like GraphQL', async () => {
    const result = await searchProducts(
      { brand: 'Nordlicht', limit: 100 },
      { headers: { authorization: USER_TOKEN } },
    );
    const { data } = await createLoggedInGraphqlFetch(USER_TOKEN)({
      query: /* GraphQL */ `
        query {
          searchProducts(filterQuery: [{ key: "meta.brand", value: "Nordlicht" }]) {
            products(limit: 100) {
              _id
            }
          }
        }
      `,
      headers: { 'x-shop-country': 'CH' },
    });
    assert.deepStrictEqual(
      ids(result),
      data.searchProducts.products.map(({ _id }) => _id),
    );
  });

  test('holds no sessions or streams and publishes an honest OCP manifest', async () => {
    const get = await fetch(`${baseUrl}/mcp/storefront`, { headers: { accept: 'text/event-stream' } });
    assert.strictEqual(get.status, 405);
    const listen = await storefront('subscriptions/listen', {});
    assert.ok(listen.error);

    const manifest = await (await fetch(`${baseUrl}/.well-known/ocp.json`)).json();
    assert.deepStrictEqual(manifest, {
      version: '1.0',
      merchant: { name: 'Test Shop', url: 'https://shop.example.com' },
      bridge: { mcp: `${baseUrl}/mcp/storefront` },
    });
  });
});
