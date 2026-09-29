import test from 'node:test';
import assert from 'node:assert';
import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { TokenizedProduct1 } from './seeds/products.js';
import { TestToken1, TestToken3 } from './seeds/tokens.js';
import { VirtualWarehousingProvider } from './seeds/warehousings.js';

let db;
let graphqlFetchAsAdmin;

const fetchMintedStock = async () => {
  const {
    data: { product },
  } = await graphqlFetchAsAdmin({
    query: /* GraphQL */ `
      query TokenizedStock($productId: ID!) {
        product(productId: $productId) {
          ... on TokenizedProduct {
            simulatedStocks {
              quantity
              warehousingProvider {
                _id
              }
            }
          }
        }
      }
    `,
    variables: { productId: TokenizedProduct1._id },
  });
  return product.simulatedStocks.find(
    ({ warehousingProvider }) => warehousingProvider._id === VirtualWarehousingProvider._id,
  ).quantity;
};

const fetchToken = async (tokenId, forceLocale) => {
  const {
    data: { token },
  } = await graphqlFetchAsAdmin({
    query: /* GraphQL */ `
      query TokenMetadata($tokenId: ID!, $forceLocale: Locale) {
        token(tokenId: $tokenId) {
          isInvalidateable
          ercMetadata(forceLocale: $forceLocale)
        }
      }
    `,
    variables: { tokenId, forceLocale },
  });
  return token;
};

test.describe('Plugin: ETH minter', () => {
  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test('stock is the supply minus the tokens issued for the product', async () => {
    // The seeds issue 6 of the 100 tokens: TestToken2 holds 2, four other tokens 1 each.
    assert.strictEqual(await fetchMintedStock(), 94);
  });

  test('stays web3 only: a ticket cancellation does not free stock', async () => {
    await db
      .collection('token_surrogates')
      .updateOne({ _id: TestToken3._id }, { $set: { 'meta.cancelled': true } });
    try {
      assert.strictEqual(await fetchMintedStock(), 94);
    } finally {
      await db
        .collection('token_surrogates')
        .updateOne({ _id: TestToken3._id }, { $unset: { 'meta.cancelled': 1 } });
    }
  });

  test('stays web3 only: no entry window around an event slot', async () => {
    await db
      .collection('products')
      .updateOne(
        { _id: TokenizedProduct1._id },
        { $set: { 'tokenization.ercMetadataProperties': { slot: '2099-01-01T19:30:00.000Z' } } },
      );
    try {
      const token = await fetchToken(TestToken1._id);
      assert.strictEqual(token.isInvalidateable, true);
    } finally {
      await db
        .collection('products')
        .updateOne(
          { _id: TokenizedProduct1._id },
          { $unset: { 'tokenization.ercMetadataProperties': 1 } },
        );
    }
  });

  test('ERC metadata never contains the token meta', async () => {
    await db
      .collection('token_surrogates')
      .updateOne(
        { _id: TestToken1._id },
        { $set: { meta: { orderId: 'order-1', cancelled: true, name: 'overridden' } } },
      );
    try {
      const { ercMetadata } = await fetchToken(TestToken1._id);
      assert.strictEqual(ercMetadata.orderId, undefined);
      assert.strictEqual(ercMetadata.cancelled, undefined);
      assert.match(ercMetadata.name, new RegExp(`#${TestToken1.tokenSerialNumber}$`));
    } finally {
      await db.collection('token_surrogates').updateOne({ _id: TestToken1._id }, { $set: { meta: {} } });
    }
  });

  test('ERC metadata links other locales of the token serial through a {locale} placeholder', async () => {
    await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation TokenizedTexts($productId: ID!, $texts: [ProductTextInput!]!) {
          updateProductTexts(productId: $productId, texts: $texts) {
            _id
          }
        }
      `,
      variables: { productId: TokenizedProduct1._id, texts: [{ locale: 'de', title: 'Konzert' }] },
    });
    const { ercMetadata } = await fetchToken(TestToken1._id, 'de');
    assert.match(
      ercMetadata.localization.uri,
      new RegExp(
        `/erc-metadata/${TokenizedProduct1._id}/\\{locale\\}/${TestToken1.tokenSerialNumber}\\.json$`,
      ),
    );
  });
});
