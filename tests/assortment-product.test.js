import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { SimpleAssortment, AssortmentProduct } from './seeds/assortments.js';
import { SimpleProduct } from './seeds/products.js';

let graphqlFetch;

describe('AssortmentProduct', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('mutation.reorderAssortmentProducts for admin user should', () => {
    it('reorder assortment product successfuly when passed valid assortment product ID', async () => {
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

      expect(reorderAssortmentProducts[0].sortKey).toEqual(10);
    });

    it('return empty array when passed non-existing assortment product ID', async () => {
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
      expect(reorderAssortmentProducts.length).toEqual(0);
    });
  });

  describe('mutation.reorderAssortmentProducts for anonymous user should', () => {
    it('return error', async () => {
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
      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('mutation.addAssortmentProduct for admin user should', () => {
    it('add assortment successfuly when passed valid assortment & product id', async () => {
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

      expect(data?.addAssortmentProduct).toMatchObject({
        tags: ['assortment-product-et'],
        assortment: { _id: SimpleAssortment[1]._id },
        product: { _id: SimpleProduct._id },
      });
    });

    it('return not found error when passed non existing product id', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error when passed in-valid product id', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });

    it('return not found error when passed non existing assortment id', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('AssortmentNotFoundError');
    });

    it('return error when passed in-valid assortment id', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.addAssortmentProduct anonymous user should', () => {
    it('return error', async () => {
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

      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('mutation.removeAssortmentProduct for admin user should', () => {
    it('remove assortment product successfuly when passed valid assortment product id', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('AssortmentProductNotFoundError');
    });

    it('return not found error when passed non existing assortment product id', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('AssortmentProductNotFoundError');
    });

    it('return error when passed invalid assortment product id', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.removeAssortmentProduct for anonymous user should', () => {
    it('return error', async () => {
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
      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });
});
