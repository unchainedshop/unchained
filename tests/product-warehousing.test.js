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
import {
  PickupDeliveryProvider,
  SendMailDeliveryProvider,
  SimpleDeliveryProvider,
} from './seeds/deliveries.js';
import { SimpleWarehousingProvider } from './seeds/warehousings.js';

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

  test.describe('SimpleProduct.simulatedDispatches and simulatedStocks', async () => {
    test('return one row per provider pair, filtered by deliveryProviderType', async () => {
      const providerFields = /* GraphQL */ `
        deliveryProvider {
          _id
        }
        warehousingProvider {
          _id
        }
      `;
      const { data: { product } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query Simulations($productId: ID!) {
            product(productId: $productId) {
              ... on SimpleProduct {
                dispatches: simulatedDispatches { ${providerFields} }
                pickUpDispatches: simulatedDispatches(deliveryProviderType: PICKUP) { ${providerFields} }
                allDispatches: simulatedDispatches(deliveryProviderType: null) { ${providerFields} }
                stocks: simulatedStocks { ${providerFields} }
                pickUpStocks: simulatedStocks(deliveryProviderType: PICKUP) { ${providerFields} }
                allStocks: simulatedStocks(deliveryProviderType: null) { ${providerFields} }
              }
            }
          }
        `,
        variables: { productId: SimpleProduct._id },
      });
      assert.strictEqual(errors, undefined);

      const providerPairs = (rows) =>
        rows.map(({ deliveryProvider, warehousingProvider }) => [
          deliveryProvider._id,
          warehousingProvider._id,
        ]);
      const shippingPairs = [
        [SimpleDeliveryProvider._id, SimpleWarehousingProvider._id],
        [SendMailDeliveryProvider._id, SimpleWarehousingProvider._id],
      ];
      const pickUpPairs = [[PickupDeliveryProvider._id, SimpleWarehousingProvider._id]];

      // SHIPPING is the schema default, an explicit null asks for every delivery provider type
      assert.deepStrictEqual(providerPairs(product.dispatches), shippingPairs);
      assert.deepStrictEqual(providerPairs(product.pickUpDispatches), pickUpPairs);
      assert.deepStrictEqual(providerPairs(product.allDispatches), [...shippingPairs, ...pickUpPairs]);
      assert.deepStrictEqual(providerPairs(product.stocks), shippingPairs);
      assert.deepStrictEqual(providerPairs(product.pickUpStocks), pickUpPairs);
      assert.deepStrictEqual(providerPairs(product.allStocks), [...shippingPairs, ...pickUpPairs]);
    });
  });
});
