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
let db;

test.describe('Product: Supply', async () => {
  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('mutation.updateProductSupply should for admin user', async () => {
    test('Update product supply successfuly when passed SIMPLE_PRODUCT type', async () => {
      const { data: { updateProductSupply } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductSupply($productId: ID!, $supply: UpdateProductSupplyInput!) {
            updateProductSupply(productId: $productId, supply: $supply) {
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
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          supply: {
            weightInGram: 100,
            heightInMillimeters: 200,
            lengthInMillimeters: 300,
            widthInMillimeters: 400,
          },
        },
      });

      assert.strictEqual(updateProductSupply._id, SimpleProduct._id);
      const updatedProduct = await db.collection('products').findOne({ _id: SimpleProduct._id });
      assert.deepStrictEqual(updatedProduct.supply, {
        weightInGram: 100,
        heightInMillimeters: 200,
        lengthInMillimeters: 300,
        widthInMillimeters: 400,
      });
    });

    test('return error when passed non SIMPLE_PRODUCT type', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductSupply($productId: ID!, $supply: UpdateProductSupplyInput!) {
            updateProductSupply(productId: $productId, supply: $supply) {
              _id
            }
          }
        `,
        variables: {
          productId: PlanProduct._id,
          supply: {
            weightInGram: 100,
            heightInMillimeters: 200,
            lengthInMillimeters: 300,
            widthInMillimeters: 400,
          },
        },
      });

      assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
        code: 'ProductWrongTypeError',
        received: 'PLAN_PRODUCT',
        required: 'SIMPLE_PRODUCT',
      });
    });

    test('return not found error when passed non existing productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductSupply($productId: ID!, $supply: UpdateProductSupplyInput!) {
            updateProductSupply(productId: $productId, supply: $supply) {
              _id
            }
          }
        `,
        variables: {
          productId: 'none-existing-id',
          supply: {
            weightInGram: 100,
            heightInMillimeters: 200,
            lengthInMillimeters: 300,
            widthInMillimeters: 400,
          },
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return error when passed invalid productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductSupply($productId: ID!, $supply: UpdateProductSupplyInput!) {
            updateProductSupply(productId: $productId, supply: $supply) {
              _id
            }
          }
        `,
        variables: {
          productId: '',
          supply: {
            weightInGram: 100,
            heightInMillimeters: 200,
            lengthInMillimeters: 300,
            widthInMillimeters: 400,
          },
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.updateProductSupply for anonymous user', async () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateProductSupply($productId: ID!, $supply: UpdateProductSupplyInput!) {
            updateProductSupply(productId: $productId, supply: $supply) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          supply: {
            weightInGram: 100,
            heightInMillimeters: 200,
            lengthInMillimeters: 300,
            widthInMillimeters: 400,
          },
        },
      });

      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });
});
