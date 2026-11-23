import assert from 'node:assert';
import test from 'node:test';
import {
  setupDatabase,
  getServerBaseUrl,
  createAnonymousGraphqlFetch,
  createLoggedInGraphqlFetch,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import { seedStorefrontCatalog } from './seeds/storefront.js';

let baseUrl;
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

const SetSearchInput = /* GraphQL */ `
  mutation SetSearchInput($filterId: ID!, $name: String) {
    setFilterStorefrontSearchInput(filterId: $filterId, name: $name) {
      storefrontSearchInput
    }
  }
`;

const setSearchInput = (filterId, name, token = ADMIN_TOKEN) =>
  createLoggedInGraphqlFetch(token)({ query: SetSearchInput, variables: { filterId, name } });

const ids = (result) => result.structuredContent.products.map(({ id }) => id);

test.describe('Storefront MCP', () => {
  test.before(async () => {
    const [db] = await setupDatabase();
    baseUrl = getServerBaseUrl();
    filterIds = await seedStorefrontCatalog(db, createLoggedInGraphqlFetch());
    await setSearchInput(filterIds.brand, 'brand');
    await setSearchInput(filterIds.priceCH, 'price_ch');
    await setSearchInput(filterIds.priceDE, 'price_de');
  });

  test('discovers the merchant inputs, the shop sort orders and the product cards', async () => {
    const tool = await searchTool();
    const { properties } = tool.inputSchema;
    assert.deepStrictEqual(properties.brand.enum, ['Nordlicht', 'Alpenwerk']);
    assert.match(properties.price_ch.description, /CHF in Rappen.*lower:upper/);
    assert.match(properties.price_de.description, /EUR in Cent/);
    assert.deepStrictEqual(properties.sort.enum, ['meta_rating_DESC']);
    assert.strictEqual(tool.inputSchema.additionalProperties, false);
    assert.strictEqual(tool._meta.ui.resourceUri, 'ui://test/product-cards.html');

    const { result } = await storefront('resources/read', { uri: 'ui://test/product-cards.html' });
    assert.strictEqual(result.contents[0].mimeType, 'text/html;profile=mcp-app');
  });

  test('follows renamed, changed and removed inputs on the next discovery', async () => {
    await setSearchInput(filterIds.brand, 'make');
    const renamed = (await searchTool()).inputSchema.properties;
    assert.ok(renamed.make && !renamed.brand);

    const obsolete = await searchProducts({ brand: 'Nordlicht' });
    assert.strictEqual(obsolete.isError, true);
    assert.match(obsolete.content[0].text, /brand.*accepted inputs: make, price_ch, price_de/);

    await setSearchInput(filterIds.brand, null);
    assert.ok(!(await searchTool()).inputSchema.properties.make);
    await setSearchInput(filterIds.brand, 'brand');
  });

  test('rejects reserved, invalid and duplicate names and non-admin writes', async () => {
    const codes = async (name, token) =>
      (await setSearchInput(filterIds.brand, name, token)).errors?.map(
        ({ extensions }) => extensions.code,
      );
    assert.deepStrictEqual(await codes('query'), ['InvalidStorefrontSearchInputError']);
    assert.deepStrictEqual(await codes('meta.brand'), ['InvalidStorefrontSearchInputError']);
    assert.deepStrictEqual(await codes('price_ch'), ['StorefrontSearchInputInUseError']);
    assert.deepStrictEqual(await codes('brand', USER_TOKEN), ['NoPermissionError']);
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
