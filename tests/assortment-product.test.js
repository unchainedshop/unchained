import assert from 'node:assert';
import test from 'node:test';
import { setupDatabase, disconnect } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { SimpleAssortment, AssortmentProduct } from './seeds/assortments.js';
import { SimpleProduct } from './seeds/products.js';

let createLoggedInGraphqlFetch;
let createAnonymousGraphqlFetch;

test.describe('AssortmentProduct', () => {
  let graphqlFetch;

  test.before(async () => {
    ({ createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } = await setupDatabase());
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('mutation.reorderAssortmentProducts for admin user should', () => {
    test('reorder assortment product successfuly when passed valid assortment product ID', async () => {
      const {
        data: { reorderAssortmentProducts },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation ReorderAssortmentProducts($sortKeys: [ReorderAssortmentProductInput!]!) {
            reorderAssortmentProducts(sortKeys: $sortKeys) {
              _id
              sortKey
              tags
              assortment {
                _id
              }
              product {
                _id
              }
            }
          }
        `,
        variables: {
          sortKeys: [
            {
              assortmentProductId: AssortmentProduct._id,
              sortKey: 9,
            },
          ],
        },
      });

      assert.strictEqual(reorderAssortmentProducts[0].sortKey, 10);
    });

    test('return empty array when passed non-existing assortment product ID', async () => {
      const {
        data: { reorderAssortmentProducts },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation ReorderAssortmentProducts($sortKeys: [ReorderAssortmentProductInput!]!) {
            reorderAssortmentProducts(sortKeys: $sortKeys) {
              _id
            }
          }
        `,
        variables: {
          sortKeys: [
            {
              assortmentProductId: 'none-existing-id',
              sortKey: 9,
            },
          ],
        },
      });
      assert.strictEqual(reorderAssortmentProducts.length, 0);
    });
  });

  test.describe('mutation.reorderAssortmentProducts for anonymous user should', () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation ReorderAssortmentProducts($sortKeys: [ReorderAssortmentProductInput!]!) {
            reorderAssortmentProducts(sortKeys: $sortKeys) {
              _id
            }
          }
        `,
        variables: {
          sortKeys: [
            {
              assortmentProductId: 'none-existing-id',
              sortKey: 9,
            },
          ],
        },
      });
      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.addAssortmentProduct for admin user should', () => {
    test('add assortment successfuly when passed valid assortment & product id', async () => {
      const { data } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentProduct($assortmentId: ID!, $productId: ID!, $tags: [LowerCaseString!]) {
            addAssortmentProduct(assortmentId: $assortmentId, productId: $productId, tags: $tags) {
              _id
              sortKey
              tags
              assortment {
                _id
              }
              product {
                _id
              }
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[1]._id,
          productId: SimpleProduct._id,
          tags: ['assortment-product-et'],
        },
      });

      assert.partialDeepStrictEqual(data?.addAssortmentProduct, {
        tags: ['assortment-product-et'],
        assortment: { _id: SimpleAssortment[1]._id },
        product: { _id: SimpleProduct._id },
      });
    });

    test('return not found error when passed non existing product id', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentProduct($assortmentId: ID!, $productId: ID!, $tags: [LowerCaseString!]) {
            addAssortmentProduct(assortmentId: $assortmentId, productId: $productId, tags: $tags) {
              _id
              sortKey
              tags
              assortment {
                _id
              }
              product {
                _id
              }
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          productId: 'non-existing-product-id',
          tags: ['assortment-product-et'],
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return error when passed in-valid product id', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentProduct($assortmentId: ID!, $productId: ID!, $tags: [LowerCaseString!]) {
            addAssortmentProduct(assortmentId: $assortmentId, productId: $productId, tags: $tags) {
              _id
              sortKey
              tags
              assortment {
                _id
              }
              product {
                _id
              }
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          productId: '',
          tags: ['assortment-product-et'],
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });

    test('return not found error when passed non existing assortment id', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentProduct($assortmentId: ID!, $productId: ID!, $tags: [LowerCaseString!]) {
            addAssortmentProduct(assortmentId: $assortmentId, productId: $productId, tags: $tags) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: 'non-existing-assortment-id',
          productId: SimpleProduct._id,
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'AssortmentNotFoundError');
    });

    test('return error when passed in-valid assortment id', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentProduct($assortmentId: ID!, $productId: ID!, $tags: [LowerCaseString!]) {
            addAssortmentProduct(assortmentId: $assortmentId, productId: $productId, tags: $tags) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: '',
          productId: SimpleProduct._id,
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.addAssortmentProduct anonymous user should', () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentProduct($assortmentId: ID!, $productId: ID!, $tags: [LowerCaseString!]) {
            addAssortmentProduct(assortmentId: $assortmentId, productId: $productId, tags: $tags) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          productId: SimpleProduct._id,
          tags: ['assortment-product-et'],
        },
      });

      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.removeAssortmentProduct for admin user should', () => {
    test('remove assortment product successfuly when passed valid assortment product id', async () => {
      await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentProduct($assortmentProductId: ID!) {
            removeAssortmentProduct(assortmentProductId: $assortmentProductId) {
              _id
              sortKey
              tags

              product {
                _id
              }
            }
          }
        `,
        variables: {
          assortmentProductId: AssortmentProduct._id,
        },
      });
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentProduct($assortmentProductId: ID!) {
            removeAssortmentProduct(assortmentProductId: $assortmentProductId) {
              _id
            }
          }
        `,
        variables: {
          assortmentProductId: AssortmentProduct._id,
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'AssortmentProductNotFoundError');
    });

    test('return not found error when passed non existing assortment product id', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentProduct($assortmentProductId: ID!) {
            removeAssortmentProduct(assortmentProductId: $assortmentProductId) {
              _id
            }
          }
        `,
        variables: {
          assortmentProductId: 'none-existing-id',
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'AssortmentProductNotFoundError');
    });

    test('return error when passed invalid assortment product id', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentProduct($assortmentProductId: ID!) {
            removeAssortmentProduct(assortmentProductId: $assortmentProductId) {
              _id
            }
          }
        `,
        variables: {
          assortmentProductId: '',
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.removeAssortmentProduct for anonymous user should', () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentProduct($assortmentProductId: ID!) {
            removeAssortmentProduct(assortmentProductId: $assortmentProductId) {
              _id
            }
          }
        `,
        variables: {
          assortmentProductId: AssortmentProduct._id,
        },
      });
      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });
});
