import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { SimpleProduct } from './seeds/products.js';

test.describe('Product: Commerce', async () => {
  let graphqlFetch;

  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('mutation.updateProductCommerce for admin user should', async () => {
    test('Update product pricing successfuly', async () => {
      const { data: { updateProductCommerce } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductCommerce($productId: ID!, $commerce: UpdateProductCommerceInput!) {
            updateProductCommerce(productId: $productId, commerce: $commerce) {
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
                catalogPrice {
                  amount
                  isTaxable
                  isNetPrice
                  currencyCode
                }
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          commerce: {
            pricing: [
              {
                amount: 1000,
                isTaxable: true,
                isNetPrice: false,
                currencyCode: 'CHF',
                countryCode: 'CH',
              },
              {
                amount: 100,
                minQuantity: 50,
                isTaxable: true,
                isNetPrice: false,
                currencyCode: 'CHF',
                countryCode: 'CH',
              },
            ],
          },
        },
      });

      assert.partialDeepStrictEqual(updateProductCommerce, {
        _id: SimpleProduct._id,
        catalogPrice: {
          amount: 1000,
          isTaxable: true,
          isNetPrice: false,
          currencyCode: 'CHF',
        },
      });
    });

    test('return not found error when attempting to update non existing product', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductCommerce($productId: ID!, $commerce: UpdateProductCommerceInput!) {
            updateProductCommerce(productId: $productId, commerce: $commerce) {
              _id
            }
          }
        `,
        variables: {
          productId: 'none-existing-id',
          commerce: {
            pricing: [
              {
                amount: 100,
                minQuantity: 50,
                isTaxable: true,
                isNetPrice: false,
                currencyCode: 'CHF',
                countryCode: 'CH',
              },
            ],
          },
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return error when passed invalid productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductCommerce($productId: ID!, $commerce: UpdateProductCommerceInput!) {
            updateProductCommerce(productId: $productId, commerce: $commerce) {
              _id
            }
          }
        `,
        variables: {
          productId: '',
          commerce: {
            pricing: [
              {
                amount: 100,
                minQuantity: 50,
                isTaxable: true,
                isNetPrice: false,
                currencyCode: 'CHF',
                countryCode: 'CH',
              },
            ],
          },
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.updateProductCommerce for anonymous user', async () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateProductCommerce($productId: ID!, $commerce: UpdateProductCommerceInput!) {
            updateProductCommerce(productId: $productId, commerce: $commerce) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          commerce: {
            pricing: [
              {
                amount: 100,
                minQuantity: 50,
                isTaxable: true,
                isNetPrice: false,
                currencyCode: 'CHF',
                countryCode: 'CH',
              },
            ],
          },
        },
      });

      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });
});
