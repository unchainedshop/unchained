import test from 'node:test';
import assert from 'node:assert';
import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { TokenizedProduct1 } from './seeds/products.js';
import { TestToken1 } from './seeds/tokens.js';
import { VirtualWarehousingProvider } from './seeds/warehousings.js';

let graphqlFetchAsAdmin;

test.describe('Plugin: ETH minter', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test('stock is the supply minus the tokens issued for the product', async () => {
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
    const minted = product.simulatedStocks.find(
      ({ warehousingProvider }) => warehousingProvider._id === VirtualWarehousingProvider._id,
    );
    // The seeds issue 6 of the 100 tokens: TestToken2 holds 2, four other tokens 1 each.
    assert.strictEqual(minted.quantity, 94);
  });

  test('ERC metadata links other locales through a {locale} placeholder', async () => {
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
    const {
      data: { token },
    } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        query TokenMetadata($tokenId: ID!) {
          token(tokenId: $tokenId) {
            ercMetadata(forceLocale: "de")
          }
        }
      `,
      variables: { tokenId: TestToken1._id },
    });
    assert.match(
      token.ercMetadata.localization.uri,
      new RegExp(
        `/erc-metadata/${TokenizedProduct1._id}/\\{locale\\}/${TokenizedProduct1.tokenization.tokenId}\\.json$`,
      ),
    );
  });
});
