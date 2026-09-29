import test from 'node:test';
import assert from 'node:assert';
import { setupDatabase, disconnect, getServerBaseUrl } from './helpers.js';
import { TokenizedProduct1 } from './seeds/products.js';
import { TestToken1 } from './seeds/tokens.js';

// A second ERC721 product on the contract of the seeded tokens, like off-chain tickets sharing a
// placeholder address: a lookup by contract address alone would serve it TestToken1
const TokenizedProduct2 = {
  ...TokenizedProduct1,
  _id: 'tokenized-product-2',
  slugs: ['tokenized-product-2'],
  tokenization: { ...TokenizedProduct1.tokenization, contractAddress: TestToken1.contractAddress },
};
const OtherProductToken = {
  ...TestToken1,
  _id: 'test-token-other-product',
  productId: TokenizedProduct2._id,
  tokenSerialNumber: 'OTHER001',
};

const get = async (path) => {
  const response = await fetch(`${getServerBaseUrl()}${path}`);
  const body = await response.text();
  assert.doesNotMatch(body, /Route GET:.* not found/);
  return { status: response.status, json: body ? JSON.parse(body) : null };
};

test.describe('Plugin: ERC metadata routes', () => {
  test.before(async () => {
    const [db] = await setupDatabase();
    await db.collection('products').insertOne(TokenizedProduct2);
    await db.collection('token_surrogates').insertOne(OtherProductToken);
    await db.collection('product_texts').insertOne({
      _id: 'tokenized-product-de',
      productId: TokenizedProduct1._id,
      locale: 'de',
      title: 'Konzert',
    });
    // Private data an adapter may keep in token.meta
    await db
      .collection('token_surrogates')
      .updateOne(
        { _id: TestToken1._id },
        { $set: { meta: { orderId: 'order-1', cancelled: true, attendeeName: 'Jane Doe' } } },
      );
  });

  test.after(async () => {
    await disconnect();
  });

  for (const path of [
    `/erc-metadata/${TokenizedProduct1._id}/${TestToken1.tokenSerialNumber}.json`,
    `/erc-metadata/${TokenizedProduct1._id}/de/${TestToken1.tokenSerialNumber}.json`,
  ]) {
    test(`GET ${path} serves the public metadata of the product's token`, async () => {
      const { status, json } = await get(path);
      assert.strictEqual(status, 200);
      assert.strictEqual(json.name, `Konzert #${TestToken1.tokenSerialNumber}`);
      for (const key of Object.keys(json)) {
        assert.ok(
          [
            'name',
            'description',
            'image',
            'properties',
            'attributes',
            'localization',
            'external_url',
            'animation_url',
            'background_color',
            'decimals',
          ].includes(key),
          `unexpected public key ${key}`,
        );
      }
      assert.strictEqual(json.orderId, undefined);
      assert.strictEqual(json.attendeeName, undefined);
    });
  }

  test('an ERC721 serial resolves only within its own product', async () => {
    assert.strictEqual(
      (await get(`/erc-metadata/${TokenizedProduct1._id}/${OtherProductToken.tokenSerialNumber}.json`))
        .status,
      404,
    );
    assert.strictEqual(
      (await get(`/erc-metadata/${TokenizedProduct2._id}/${TestToken1.tokenSerialNumber}.json`)).status,
      404,
    );
  });

  test('answers 404 for an unknown serial or product', async () => {
    assert.strictEqual((await get(`/erc-metadata/${TokenizedProduct1._id}/UNKNOWN.json`)).status, 404);
    assert.strictEqual(
      (await get(`/erc-metadata/unknown-product/${TestToken1.tokenSerialNumber}.json`)).status,
      404,
    );
  });
});
