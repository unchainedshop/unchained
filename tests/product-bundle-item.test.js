import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { PlanProduct, SimpleProduct, SimpleProductBundle } from './seeds/products.js';

let graphqlFetch;

describe('ProductBundleItem', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('mutation.createProductBundleItem for admin user should', () => {
    it('create product bundle item successfuly when passed BUNDLE_PRODUCT type', async () => {
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

      expect(createProductBundleItem.bundleItems?.[0]).toMatchObject({
        product: { _id: SimpleProduct._id },
        quantity: 100,
      });
    });

    it('return error when passed non BUNDLE_PRODUCT type', async () => {
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
      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'ProductWrongTypeError',
        received: SimpleProduct.type,
        required: 'BUNDLE_PRODUCT',
      });
    });

    it('return not found error when passed non existing product ID', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error when passed invalid product ID', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });

    it('return not found error when passed non existing bundle product ID', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error when passed invalid bundle product ID', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.createProductBundleItem for anonymous user should', () => {
    it('return error', async () => {
      const graphQlAnonymousFetch = await createAnonymousGraphqlFetch();
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
      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('mutation.removeBundleItem for admin user should', () => {
    it('remove product bundle item successfuly when passed BUNDLE_PRODUCT type', async () => {
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

      expect(removeBundleItem._id).toEqual(SimpleProductBundle._id);
    });

    it('return error when passed non BUNDLE_PRODUCT type', async () => {
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

      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'ProductWrongTypeError',
        productId: 'simpleproduct',
        received: 'SIMPLE_PRODUCT',
        required: 'BUNDLE_PRODUCT',
      });
    });
    it('return not found error when passed non existing product ID', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
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
          productId: '',
          index: 0,
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
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
      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });
});
