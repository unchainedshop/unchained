import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import { SimpleProduct } from './seeds/products.js';

let graphqlFetchAsAdmin;
let graphqlFetchAsUser;
let graphqlFetchAsAnonymous;

test.describe('Product Tokenization', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymous = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.updateProductTokenization for admin user', () => {
    test('should update tokenization for a tokenized product', async () => {
      const {
        data: { createProduct },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation CreateProduct($product: CreateProductInput!, $texts: [ProductTextInput!]) {
            createProduct(product: $product, texts: $texts) {
              _id
              status
            }
          }
        `,
        variables: {
          product: {
            type: 'TOKENIZED_PRODUCT',
          },
          texts: [
            {
              title: 'Test Tokenized Product',
              locale: 'de',
            },
          ],
        },
      });

      const {
        data: { updateProductTokenization },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation UpdateProductTokenization(
            $productId: ID!
            $tokenization: UpdateProductTokenizationInput!
          ) {
            updateProductTokenization(productId: $productId, tokenization: $tokenization) {
              _id
              ... on TokenizedProduct {
                contractAddress
                tokens {
                  chainId
                  ercMetadata
                  quantity
                  tokenSerialNumber
                }
              }
            }
          }
        `,
        variables: {
          productId: createProduct._id,
          tokenization: {
            contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
            supply: 1000,
            contractStandard: 'ERC721',
            tokenId: '123',
          },
        },
      });

      assert.ok(updateProductTokenization);
      assert.strictEqual(updateProductTokenization._id, createProduct._id);
      assert.strictEqual(
        updateProductTokenization.contractAddress,
        '0x1234567890abcdef1234567890abcdef12345678',
      );
    });

    test('keeps, replaces and clears ercMetadataProperties by partial update rules', async () => {
      const {
        data: { createProduct },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation CreateProduct($product: CreateProductInput!, $texts: [ProductTextInput!]) {
            createProduct(product: $product, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          product: { type: 'TOKENIZED_PRODUCT' },
          texts: [{ title: 'Concert', locale: 'de' }],
        },
      });

      const updateTokenization = async (tokenization) => {
        const { data, errors } = await graphqlFetchAsAdmin({
          query: /* GraphQL */ `
            mutation UpdateProductTokenization(
              $productId: ID!
              $tokenization: UpdateProductTokenizationInput!
            ) {
              updateProductTokenization(productId: $productId, tokenization: $tokenization) {
                _id
                ... on TokenizedProduct {
                  contractAddress
                  contractStandard
                  contractConfiguration {
                    tokenId
                    supply
                    ercMetadataProperties
                  }
                }
              }
            }
          `,
          variables: { productId: createProduct._id, tokenization },
        });
        assert.strictEqual(errors, undefined);
        return data.updateProductTokenization;
      };

      // Off-chain: no contract address and no token id
      const created = await updateTokenization({
        contractStandard: 'ERC721',
        supply: 100,
        ercMetadataProperties: { slot: '2030-01-01T19:30:00.000Z', category: 'jazz' },
      });
      assert.strictEqual(created.contractAddress, null);
      assert.deepStrictEqual(created.contractConfiguration, {
        tokenId: null,
        supply: 100,
        ercMetadataProperties: { slot: '2030-01-01T19:30:00.000Z', category: 'jazz' },
      });

      // The admin Token tab never sends ercMetadataProperties: the slot must survive
      const kept = await updateTokenization({
        contractAddress: '0x0',
        contractStandard: 'ERC721',
        tokenId: '0',
        supply: 80,
      });
      assert.strictEqual(kept.contractAddress, '0x0');
      assert.deepStrictEqual(kept.contractConfiguration, {
        tokenId: '0',
        supply: 80,
        ercMetadataProperties: { slot: '2030-01-01T19:30:00.000Z', category: 'jazz' },
      });

      // An object replaces the stored properties as a whole
      const replaced = await updateTokenization({
        contractStandard: 'ERC721',
        supply: 80,
        ercMetadataProperties: { slot: '2030-01-02T19:30:00.000Z' },
      });
      assert.strictEqual(replaced.contractAddress, '0x0');
      assert.deepStrictEqual(replaced.contractConfiguration.ercMetadataProperties, {
        slot: '2030-01-02T19:30:00.000Z',
      });

      // null clears
      const cleared = await updateTokenization({
        contractAddress: null,
        contractStandard: 'ERC721',
        tokenId: null,
        supply: 80,
        ercMetadataProperties: null,
      });
      assert.strictEqual(cleared.contractAddress, null);
      assert.deepStrictEqual(cleared.contractConfiguration, {
        tokenId: null,
        supply: 80,
        ercMetadataProperties: null,
      });
    });

    test('should return error when product not found', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation UpdateProductTokenization(
            $productId: ID!
            $tokenization: UpdateProductTokenizationInput!
          ) {
            updateProductTokenization(productId: $productId, tokenization: $tokenization) {
              _id
            }
          }
        `,
        variables: {
          productId: 'non-existing-product',
          tokenization: {
            contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
            supply: 1000,
            contractStandard: 'ERC721',
            tokenId: '123',
          },
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('should return error when product is not TokenizedProduct type', async () => {
      const {
        data: { createProduct },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation CreateProduct($product: CreateProductInput!, $texts: [ProductTextInput!]) {
            createProduct(product: $product, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          product: {
            type: 'SIMPLE_PRODUCT',
          },
          texts: [
            {
              title: 'Test Simple Product',
              locale: 'de',
            },
          ],
        },
      });

      const productId = createProduct._id;

      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation UpdateProductTokenization(
            $productId: ID!
            $tokenization: UpdateProductTokenizationInput!
          ) {
            updateProductTokenization(productId: $productId, tokenization: $tokenization) {
              _id
            }
          }
        `,
        variables: {
          productId,
          tokenization: {
            contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
            supply: 1000,
            contractStandard: 'ERC721',
            tokenId: '123',
          },
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductWrongStatusError');
    });
  });

  test.describe('Mutation.updateProductTokenization for normal user', () => {
    test('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation UpdateProductTokenization(
            $productId: ID!
            $tokenization: UpdateProductTokenizationInput!
          ) {
            updateProductTokenization(productId: $productId, tokenization: $tokenization) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          tokenization: {
            contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
            supply: 1000,
            contractStandard: 'ERC721',
            tokenId: '123',
          },
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.updateProductTokenization for anonymous user', () => {
    test('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymous({
        query: /* GraphQL */ `
          mutation UpdateProductTokenization(
            $productId: ID!
            $tokenization: UpdateProductTokenizationInput!
          ) {
            updateProductTokenization(productId: $productId, tokenization: $tokenization) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          tokenization: {
            contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
            supply: 1000,
            contractStandard: 'ERC721',
            tokenId: '123',
          },
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });
});
