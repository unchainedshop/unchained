import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { ADMIN_TOKEN } from './seeds/users';
import { SimpleProduct, UnpublishedProduct } from './seeds/products';

let connection;
let graphqlFetch;

describe('Products', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.createProduct', () => {
    it('create a new product', async () => {
      const { data: { createProduct } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createProduct($product: CreateProductInput!) {
            createProduct(product: $product) {
              status
              tags
              texts {
                title
              }
              ... on SimpleProduct {
                catalogPrice {
                  _id
                  price {
                    amount
                    currency
                  }
                }
                simulatedPrice {
                  _id
                  price {
                    amount
                    currency
                  }
                }
              }
            }
          }
        `,
        variables: {
          product: {
            title: 'Simple Product',
            type: 'SimpleProduct',
            tags: ['simple'],
          },
        },
      });
      expect(createProduct).toMatchObject({
        tags: ['simple'],
        status: 'DRAFT',
        texts: {
          title: 'Simple Product',
        },
        catalogPrice: null,
        simulatedPrice: null,
      });
    });
  });

  describe('Mutation.unpublishProduct', () => {
    it('unpublish product', async () => {
      const { data: { unpublishProduct } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UnPublishProduct($productId: ID!) {
            unpublishProduct(productId: $productId) {
              _id
              sequence
              status
              published
              tags
              created
              updated
              texts {
                _id
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
                links {
                  assortmentId
                  link {
                    _id
                  }
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
        },
      });

      expect(unpublishProduct.published).toBe(null);
    });
    it('return error for non-existing product id', async () => {
      const { errors = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UnpublishProduct($productId: ID!) {
            unpublishProduct(productId: $productId) {
              _id
            }
          }
        `,
        variables: {
          productId: 'non-existing-id',
        },
      });
      expect(errors.length).toEqual(1);
    });
  });

  describe('mutation.publishProduct', () => {
    it('publish product', async () => {
      const { data } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation PublishProduct($productId: ID!) {
            publishProduct(productId: $productId) {
              _id
              sequence
              status
              published
              tags
              created
              updated
              texts {
                _id
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
                links {
                  assortmentId
                  link {
                    _id
                  }
                }
              }
              siblings {
                _id
              }
            }
          }
        `,
        variables: {
          productId: UnpublishedProduct._id,
        },
      });
      expect(data?.publishProduct).toMatchObject({
        _id: UnpublishedProduct._id,
        status: 'ACTIVE',
      });
    });

    it('return not found error for non-existing product id', async () => {
      const { errors = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation PublishProduct2($productId: ID!) {
            publishProduct(productId: $productId) {
              _id
            }
          }
        `,
        variables: {
          productId: 'non-existing-id',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });
    it('return error for non-existing product id', async () => {
      const { errors = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation PublishProduct2($productId: ID!) {
            publishProduct(productId: $productId) {
              _id
            }
          }
        `,
        variables: {
          productId: '',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Mutation.updateProduct should', () => {
    it('update successfuly when passed valid product ID ', async () => {
      const { data: { updateProduct } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProduct(
            $productId: ID!
            $product: UpdateProductInput!
          ) {
            updateProduct(productId: $productId, product: $product) {
              _id
              sequence
              tags
              meta
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          product: {
            sequence: 1,
            tags: ['tag-1', 'tag-2', 'highlight', 'update-tag'],
            meta: {
              updated: true,
            },
          },
        },
      });

      expect(updateProduct).toMatchObject({
        _id: 'simpleproduct',
        sequence: 1,
        tags: ['tag-1', 'tag-2', 'highlight', 'update-tag'],
        meta: { updated: true },
      });
    });

    it('return error when passed non-existing product id', async () => {
      const { errors = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProduct(
            $productId: ID!
            $product: UpdateProductInput!
          ) {
            updateProduct(productId: $productId, product: $product) {
              _id
            }
          }
        `,
        variables: {
          productId: 'none-existing-id',
          product: {
            sequence: 1,
            tags: ['tag-1', 'tag-2', 'highlight', 'update-tag'],
            meta: {
              updated: true,
            },
          },
        },
      });
      expect(errors.length).toEqual(1);
    });
  });

  describe('Mutation.removeProduct should', () => {
    it('remove product completly when passed valid product ID ', async () => {
      const { data: { removeProduct } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveProduct($productId: ID!) {
            removeProduct(productId: $productId) {
              _id
              sequence
              status
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
        },
      });

      expect(removeProduct.status).toBe('DELETED');
    });

    it('return error when attempting to delete already removed product ', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveProduct($productId: ID!) {
            removeProduct(productId: $productId) {
              _id
              sequence
              status
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
        },
      });
      expect(errors.length).toBe(1);
    });

    it('return not found error when passed non-existing product id', async () => {
      const { errors = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveProduct($productId: ID!) {
            removeProduct(productId: $productId) {
              _id
              sequence
              status
            }
          }
        `,
        variables: {
          productId: 'none-existing-id',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error when passed invalid product id', async () => {
      const { errors = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveProduct($productId: ID!) {
            removeProduct(productId: $productId) {
              _id
            }
          }
        `,
        variables: {
          productId: '',
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });
});
