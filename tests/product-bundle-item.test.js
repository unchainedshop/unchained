import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { PlanProduct, SimpleProduct, SimpleProductBundle } from './seeds/products.js';

test.describe('Product: BundleItem', async () => {
  let graphqlFetch;

  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('mutation.createProductBundleItem for admin user should', async () => {
    test('create product bundle item successfuly when passed BUNDLE_PRODUCT type', async () => {
      const { data: { createProductBundleItem } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateProductBundleItem($productId: ID!, $item: CreateProductBundleItemInput!) {
            createProductBundleItem(productId: $productId, item: $item) {
              _id
              sequence
              status
              tags
              created
              updated
              published
              texts {
                _id
                locale
                slug
                title
                subtitle
                description
                vendor
                brand
                labels
              }
              media {
                _id
              }
              reviews {
                _id
              }
              assortmentPaths {
                assortmentProduct {
                  _id
                }
              }
              siblings {
                _id
              }
              ... on BundleProduct {
                bundleItems {
                  product {
                    _id
                  }
                  quantity
                }
              }
            }
          }
        `,
        variables: {
          productId: SimpleProductBundle._id,
          item: {
            productId: SimpleProduct._id,
            quantity: 100,
          },
        },
      });

      assert.deepStrictEqual(createProductBundleItem.bundleItems?.[0], {
        product: { _id: SimpleProduct._id },
        quantity: 100,
      });
    });

    test('return error when passed non BUNDLE_PRODUCT type', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateProductBundleItem($productId: ID!, $item: CreateProductBundleItemInput!) {
            createProductBundleItem(productId: $productId, item: $item) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          item: {
            productId: PlanProduct._id,
            quantity: 100,
          },
        },
      });
      assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
        code: 'ProductWrongTypeError',
        received: SimpleProduct.type,
        required: 'BUNDLE_PRODUCT',
      });
    });

    test('return not found error when passed non existing product ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateProductBundleItem($productId: ID!, $item: CreateProductBundleItemInput!) {
            createProductBundleItem(productId: $productId, item: $item) {
              _id
            }
          }
        `,
        variables: {
          productId: 'invalid-product-id',
          item: {
            productId: SimpleProductBundle._id,
            quantity: 100,
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return error when passed invalid product ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateProductBundleItem($productId: ID!, $item: CreateProductBundleItemInput!) {
            createProductBundleItem(productId: $productId, item: $item) {
              _id
            }
          }
        `,
        variables: {
          productId: '',
          item: {
            productId: SimpleProductBundle._id,
            quantity: 100,
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });

    test('return not found error when passed non existing bundle product ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateProductBundleItem($productId: ID!, $item: CreateProductBundleItemInput!) {
            createProductBundleItem(productId: $productId, item: $item) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProductBundle._id,
          item: {
            productId: 'invalid-product-id',
            quantity: 100,
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return error when passed invalid bundle product ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateProductBundleItem($productId: ID!, $item: CreateProductBundleItemInput!) {
            createProductBundleItem(productId: $productId, item: $item) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProductBundle._id,
          item: {
            productId: '',
            quantity: 100,
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.createProductBundleItem for anonymous user should', async () => {
    test('return error', async () => {
      const graphQlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphQlAnonymousFetch({
        query: /* GraphQL */ `
          mutation CreateProductBundleItem($productId: ID!, $item: CreateProductBundleItemInput!) {
            createProductBundleItem(productId: $productId, item: $item) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          item: {
            productId: SimpleProductBundle._id,
            quantity: 100,
          },
        },
      });
      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.removeBundleItem for admin user should', async () => {
    test('remove product bundle item successfuly when passed BUNDLE_PRODUCT type', async () => {
      const { data: { removeBundleItem } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveBundleItem($productId: ID!, $index: Int!) {
            removeBundleItem(productId: $productId, index: $index) {
              _id
              sequence
              status
              tags
              created
              updated

              published
              texts {
                _id
                locale
                slug
                title
                subtitle
                description
                vendor
                brand
                labels
              }
              media {
                _id
              }
              reviews {
                _id
              }
              assortmentPaths {
                assortmentProduct {
                  _id
                }
              }
              siblings {
                _id
              }
            }
          }
        `,
        variables: {
          productId: SimpleProductBundle._id,
          index: 10,
        },
      });

      assert.strictEqual(removeBundleItem._id, SimpleProductBundle._id);
    });

    test('return error when passed non BUNDLE_PRODUCT type', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveBundleItem($productId: ID!, $index: Int!) {
            removeBundleItem(productId: $productId, index: $index) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          index: 10,
        },
      });

      assert.deepStrictEqual(errors?.[0]?.extensions, {
        code: 'ProductWrongTypeError',
        productId: 'simpleproduct',
        received: 'SIMPLE_PRODUCT',
        required: 'BUNDLE_PRODUCT',
      });
    });
    test('return not found error when passed non existing product ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveBundleItem($productId: ID!, $index: Int!) {
            removeBundleItem(productId: $productId, index: $index) {
              _id
            }
          }
        `,
        variables: {
          productId: 'invalid-product-id',
          index: 0,
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return error when passed invalid product ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveBundleItem($productId: ID!, $index: Int!) {
            removeBundleItem(productId: $productId, index: $index) {
              _id
            }
          }
        `,
        variables: {
          productId: '',
          index: 0,
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.removeBundleItem for anonymous user should', async () => {
    test('return error', async () => {
      const graphQlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphQlAnonymousFetch({
        query: /* GraphQL */ `
          mutation RemoveBundleItem($productId: ID!, $index: Int!) {
            removeBundleItem(productId: $productId, index: $index) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          index: 0,
        },
      });
      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });
});
