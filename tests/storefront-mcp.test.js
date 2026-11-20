import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { readFile } from 'node:fs/promises';
import { roles } from '@unchainedshop/api';
import {
  createMCPClient,
  mcpAppClientCapabilities,
  MCP_APP_MIME_TYPE,
  readMCPAppResource,
} from '@ai-sdk/mcp';
import { createLoggedInGraphqlFetch, getServerBaseUrl, setupDatabase } from './helpers.js';
import { ProxyProduct, SimpleProduct } from './seeds/products.js';
import { ADMIN_TOKEN } from './seeds/users.js';

async function connectStorefront(t, headers = {}) {
  const client = await createMCPClient({
    transport: { type: 'http', url: `${getServerBaseUrl()}/mcp/storefront`, headers },
    capabilities: mcpAppClientCapabilities,
  });
  t.after(() => client.close());
  return client;
}

async function search(client, args) {
  const result = await client.callTool({ name: 'search_products', arguments: args });
  assert.ok(!result.isError, result.content[0]?.text);
  assert.deepEqual(JSON.parse(result.content[0].text), result.structuredContent);
  return result.structuredContent;
}

describe('Kitchensink storefront MCP', () => {
  before(async () => {
    const [db] = await setupDatabase();
    for (const [id, model, status, tags] of [
      ['mini', 'Mini 8', 'ACTIVE', []],
      ['city', 'City 20', 'ACTIVE', []],
      ['draft', 'Prototype', null, []],
      ['hidden', 'Private edition', 'ACTIVE', ['storefront-hidden']],
    ]) {
      await db.collection('products').insertOne({
        ...SimpleProduct,
        _id: id,
        status,
        tags,
        commerce: {
          pricing: [
            { countryCode: 'CH', currencyCode: 'CHF', amount: 3900 },
            { countryCode: 'DE', currencyCode: 'EUR', amount: 5900 },
          ],
        },
      });
      await db.collection('product_texts').insertMany([
        { _id: id + '-de', productId: id, locale: 'de', title: 'Nordlicht ' + model + ' Rucksack' },
        { _id: id + '-en', productId: id, locale: 'en', title: 'Nordlicht ' + model + ' Backpack' },
      ]);
    }
  });

  it('advertises the shop’s product cards as an MCP App resource', async (t) => {
    const client = await connectStorefront(t);
    const { tools } = await client.listTools();
    assert.deepEqual(
      tools.map(({ name }) => name),
      ['search_products'],
    );
    const uri = tools[0]._meta.ui.resourceUri;
    assert.deepEqual(Object.keys(tools[0].inputSchema.properties).sort(), [
      'limit',
      'offset',
      'product_id',
      'query',
    ]);
    assert.equal(tools[0]._meta['openai/outputTemplate'], uri);
    const { resources } = await client.listResources();
    assert.equal(resources.find((resource) => resource.uri === uri)?.mimeType, MCP_APP_MIME_TYPE);
    const { html } = await readMCPAppResource({ client, uri });
    assert.equal(
      html,
      await readFile(new URL('../examples/kitchensink/mcp/product-cards.html', import.meta.url), 'utf8'),
    );
  });

  it('applies browse pagination and keeps the full result count', async (t) => {
    const client = await connectStorefront(t);
    const first = await search(client, { limit: 1 });
    assert.ok(first.totalCount > 1);
    assert.equal(first.products.length, 1);
    const end = await search(client, { limit: 1, offset: first.totalCount });
    assert.deepEqual(end, { totalCount: first.totalCount, products: [] });
  });

  it('returns the active variant price range and leaves a missing market price unavailable', async (t) => {
    const swiss = await connectStorefront(t, { 'x-shop-country': 'CH' });
    const {
      products: [configurable],
    } = await search(swiss, { product_id: ProxyProduct._id });
    assert.deepEqual(configurable.price_range, { min: 5000, max: 300000 });
    assert.equal(configurable.price, configurable.price_range.min);
    const french = await connectStorefront(t, { 'x-shop-country': 'FR' });
    const {
      products: [unpriced],
    } = await search(french, { product_id: 'mini' });
    assert.equal(unpriced.currency, 'EUR');
    assert.equal(unpriced.price, null);
    assert.equal(unpriced.formatted_price, undefined);
  });

  for (const [country, language, name, price, currency, formattedPrice] of [
    ['CH', 'de', 'Nordlicht Mini 8 Rucksack', 39, 'CHF', 'CHF\u00a039.00'],
    ['DE', 'en', 'Nordlicht Mini 8 Backpack', 59, 'EUR', 'EUR\u00a059.00'],
  ]) {
    it(`returns matching prices and product names in the card and linked page for ${language}-${country}`, async (t) => {
      const client = await connectStorefront(t, {
        'x-shop-country': country,
        'accept-language': language,
      });
      const first = await search(client, { query: 'Nordlicht' });
      assert.equal(first.totalCount, 2);
      assert.deepEqual(first.products.map(({ id }) => id).sort(), ['city', 'mini']);
      const mini = first.products.find((product) => product.name === name);
      assert.ok(mini);

      const followUp = await search(client, { product_id: mini.id });
      assert.deepEqual(followUp, { totalCount: 1, products: [mini] });
      assert.equal(mini.price, price);
      assert.equal(mini.currency, currency);
      assert.equal(mini.formatted_price, formattedPrice);
      const response = await fetch(mini.url);
      assert.equal(response.status, 200);
      const page = await response.text();
      assert.ok(page.includes(mini.name));
      assert.ok(page.includes(mini.formatted_price));
    });
  }

  it('keeps draft and shop-hidden products out of exact lookups even with admin credentials', async (t) => {
    const client = await connectStorefront(t, { authorization: ADMIN_TOKEN });
    for (const id of ['draft', 'hidden', 'missing']) {
      assert.deepEqual(await search(client, { product_id: id }), { totalCount: 0, products: [] });
      const page = await fetch(`${getServerBaseUrl()}/shop/products/${id}`, {
        headers: { authorization: ADMIN_TOKEN },
      });
      assert.equal(page.status, 404);
    }
  });

  it('uses guest permissions when an authenticated admin opens an active product', async (t) => {
    const publicRules = roles.getConfiguredRoles().allRole.allowRules;
    const previous = publicRules.viewProduct;
    delete publicRules.viewProduct;
    t.after(() => {
      publicRules.viewProduct = previous;
    });

    const { data, errors } = await createLoggedInGraphqlFetch(ADMIN_TOKEN)({
      query: '{ product(productId: "mini") { _id } }',
    });
    assert.ifError(errors?.[0]);
    assert.equal(data.product._id, 'mini');

    const headers = { authorization: ADMIN_TOKEN };
    const client = await connectStorefront(t, headers);
    assert.deepEqual(await search(client, { product_id: 'mini' }), { totalCount: 0, products: [] });
    const page = await fetch(`${getServerBaseUrl()}/shop/products/mini`, { headers });
    assert.equal(page.status, 404);
  });
});
