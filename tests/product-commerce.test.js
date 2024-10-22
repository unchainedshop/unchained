import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { SimpleProduct } from './seeds/products.js';

let graphqlFetch;

describe('ProductsCommerce', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('mutation.updateProductCommerce for admin user should ', () => {
    it('Update product pricing successfuly', async () => {
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
                  currency
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
                amount: 100,
                maxQuantity: 50,
                isTaxable: true,
                isNetPrice: false,
                currencyCode: 'CHF',
                countryCode: 'CH',
              },
            ],
          },
        },
      });

      expect(updateProductCommerce).toMatchObject({
        _id: SimpleProduct._id,
        catalogPrice: {
          amount: 100,
          isTaxable: true,
          isNetPrice: false,
          currency: 'CHF',
        },
      });
    });

    it('return not found error when attempting to update non existing product', async () => {
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
                maxQuantity: 50,
                isTaxable: true,
                isNetPrice: false,
                currencyCode: 'CHF',
                countryCode: 'CH',
              },
            ],
          },
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error when passed invalid productId', async () => {
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
                maxQuantity: 50,
                isTaxable: true,
                isNetPrice: false,
                currencyCode: 'CHF',
                countryCode: 'CH',
              },
            ],
          },
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.updateProductCommerce for anonymous user', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
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
                maxQuantity: 50,
                isTaxable: true,
                isNetPrice: false,
                currencyCode: 'CHF',
                countryCode: 'CH',
              },
            ],
          },
        },
      });

      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });
});
