import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users';
import { SimpleProduct, SimpleProductBundle } from './seeds/products';

let connection;
let graphqlFetch;

describe('ProductBundleItem', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('mutation.createProductBundleItem for admin user should', () => {
    it('create product bundle item successfuly', async () => {
      const { data: { createProductBundleItem } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateProductBundleItem(
            $productId: ID!
            $item: CreateProductBundleItemInput!
          ) {
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
              meta
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
          productId: SimpleProduct._id,
          item: {
            productId: SimpleProductBundle._id,
            quantity: 100,
          },
        },
      });
      expect(createProductBundleItem._id).toEqual(SimpleProduct._id);
    });

    it('return error when passed invalid product ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateProductBundleItem(
            $productId: ID!
            $item: CreateProductBundleItemInput!
          ) {
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
      expect(errors.length).toEqual(1);
    });

    it('return error when passed invalid bundle product ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateProductBundleItem(
            $productId: ID!
            $item: CreateProductBundleItemInput!
          ) {
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
      expect(errors.length).toEqual(1);
    });
  });

  describe('mutation.createProductBundleItem for anonymous user should', () => {
    it('return error', async () => {
      const graphQlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphQlAnonymousFetch({
        query: /* GraphQL */ `
          mutation CreateProductBundleItem(
            $productId: ID!
            $item: CreateProductBundleItemInput!
          ) {
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
      expect(errors.length).toEqual(1);
    });
  });

  describe('mutation.removeBundleItem for admin user should', () => {
    it('remove product bundle item successfuly', async () => {
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
              meta
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
          productId: SimpleProduct._id,
          index: 10,
        },
      });
      expect(removeBundleItem._id).toEqual(SimpleProduct._id);
    });

    it('return error when passed invalid product ID', async () => {
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

      expect(errors.length).toEqual(1);
    });
  });

  describe('mutation.removeBundleItem for anonymous user should', () => {
    it('return error', async () => {
      const graphQlAnonymousFetch = await createAnonymousGraphqlFetch();
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
      expect(errors.length).toEqual(1);
    });
  });
});
