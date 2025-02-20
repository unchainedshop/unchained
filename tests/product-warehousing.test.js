import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { PlanProduct, SimpleProduct } from './seeds/products.js';

let graphqlFetch;

test.describe('Product: Warehousing', async () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('mutation.updateProductWarehousing should for admin user', async () => {
    test('Update product warehousing successfuly when passed SIMPLE_PRODUCT type', async () => {
      const { data: { updateProductWarehousing } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductWarehousing(
            $productId: ID!
            $warehousing: UpdateProductWarehousingInput!
          ) {
            updateProductWarehousing(productId: $productId, warehousing: $warehousing) {
              _id
              sequence
              status
              tags
              updated
              created
              published
              texts {
                _id
              }
              media {
                _id
              }
              reviews {
                _id
              }
              assortmentPaths {
                links {
                  link {
                    _id
                  }
                  assortmentId
                }
              }
              siblings {
                _id
              }
              ... on SimpleProduct {
                sku
                baseUnit
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          warehousing: {
            sku: 'SKU-100',
            baseUnit: 'Kg',
          },
        },
      });

      assert.partialDeepStrictEqual(updateProductWarehousing, {
        _id: SimpleProduct._id,
        sku: 'SKU-100',
        baseUnit: 'Kg',
      });
    });

    test('return error when passed non SIMPLE_PRODUCT type', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductWarehousing(
            $productId: ID!
            $warehousing: UpdateProductWarehousingInput!
          ) {
            updateProductWarehousing(productId: $productId, warehousing: $warehousing) {
              _id
            }
          }
        `,
        variables: {
          productId: PlanProduct._id,
          warehousing: {
            sku: 'SKU-100',
            baseUnit: 'Kg',
          },
        },
      });

      assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
        code: 'ProductWrongTypeError',
        received: PlanProduct.type,
        required: 'SIMPLE_PRODUCT',
      });
    });

    test('return not found error when passed non existing productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductWarehousing(
            $productId: ID!
            $warehousing: UpdateProductWarehousingInput!
          ) {
            updateProductWarehousing(productId: $productId, warehousing: $warehousing) {
              _id
            }
          }
        `,
        variables: {
          productId: 'none-existing-id',
          warehousing: {
            sku: 'SKU-100',
            baseUnit: 'Kg',
          },
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return error when passed invalid productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductWarehousing(
            $productId: ID!
            $warehousing: UpdateProductWarehousingInput!
          ) {
            updateProductWarehousing(productId: $productId, warehousing: $warehousing) {
              _id
            }
          }
        `,
        variables: {
          productId: '',
          warehousing: {
            sku: 'SKU-100',
            baseUnit: 'Kg',
          },
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.updateProductWarehousing for anonymous user', async () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateProductWarehousing(
            $productId: ID!
            $warehousing: UpdateProductWarehousingInput!
          ) {
            updateProductWarehousing(productId: $productId, warehousing: $warehousing) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          warehousing: {
            sku: 'SKU-100',
            baseUnit: 'Kg',
          },
        },
      });

      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });
});
