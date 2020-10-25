import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users';
import {
  PlanProduct,
  SimpleProduct,
  UnpublishedProduct,
} from './seeds/products';

let connection;
let graphqlFetchAsAdmin;
let graphqlFetchAsNormalUser;
let graphqlFetchAsAnonymousUser;

describe('Products', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetchAsAdmin = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = await createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.createProduct', () => {
    it('create a new product', async () => {
      const { data: { createProduct } = {} } = await graphqlFetchAsAdmin({
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
      const { data: { unpublishProduct } = {} } = await graphqlFetchAsAdmin({
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

    it('return not found error for non-existing product id', async () => {
      const { errors = {} } = await graphqlFetchAsAdmin({
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
      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error for invalid product id', async () => {
      const { errors = {} } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation UnpublishProduct($productId: ID!) {
            unpublishProduct(productId: $productId) {
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

  describe('mutation.publishProduct', () => {
    it('publish product', async () => {
      const { data } = await graphqlFetchAsAdmin({
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
      const { errors = {} } = await graphqlFetchAsAdmin({
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
      const { errors = {} } = await graphqlFetchAsAdmin({
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
      const { data: { updateProduct } = {} } = await graphqlFetchAsAdmin({
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

    it('return not found error when passed non-existing product id', async () => {
      const { errors = {} } = await graphqlFetchAsAdmin({
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
      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error when passed invalid product id', async () => {
      const { errors = {} } = await graphqlFetchAsAdmin({
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
          productId: '',
          product: {
            sequence: 1,
            tags: ['tag-1', 'tag-2', 'highlight', 'update-tag'],
            meta: {
              updated: true,
            },
          },
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Mutation.removeProduct should', () => {
    it('remove product completly when passed valid product ID ', async () => {
      const { data: { removeProduct } = {} } = await graphqlFetchAsAdmin({
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
      const { errors } = await graphqlFetchAsAdmin({
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
      const { errors = {} } = await graphqlFetchAsAdmin({
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
      const { errors = {} } = await graphqlFetchAsAdmin({
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

  describe('Mutation.updateProductPlan for admin user should', () => {
    it('update product plan successfuly', async () => {
      const { data: { updateProductPlan } = {} } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation updateProductPlan(
            $productId: ID!
            $plan: UpdateProductPlanInput!
          ) {
            updateProductPlan(productId: $productId, plan: $plan) {
              _id
              sequence
              status
              tags
              created
              updated
              published
              texts {
                _id
              }
              media(limit: 1) {
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
              ... on PlanProduct {
                plan {
                  usageCalculationType
                  billingInterval
                  billingIntervalCount
                  trialInterval
                  trialIntervalCount
                }
              }
            }
          }
        `,
        variables: {
          productId: PlanProduct._id,
          plan: {
            usageCalculationType: 'METERED',
            billingInterval: 'MONTH',
            billingIntervalCount: 1,
            trialInterval: 'WEEK',
            trialIntervalCount: 2,
          },
        },
      });

      expect(updateProductPlan).toMatchObject({
        _id: PlanProduct._id,
        plan: {
          usageCalculationType: 'METERED',
          billingInterval: 'MONTH',
          billingIntervalCount: 1,
          trialInterval: 'WEEK',
          trialIntervalCount: 2,
        },
      });
    });
  });

  describe('Mutation.updateProductPlan for normal user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation updateProductPlan(
            $productId: ID!
            $plan: UpdateProductPlanInput!
          ) {
            updateProductPlan(productId: $productId, plan: $plan) {
              _id
              ... on PlanProduct {
                plan {
                  usageCalculationType
                  billingInterval
                  billingIntervalCount
                  trialInterval
                  trialIntervalCount
                }
              }
            }
          }
        `,
        variables: {
          productId: PlanProduct._id,
          plan: {
            usageCalculationType: 'LICENSED',
            billingInterval: 'WEEK',
            billingIntervalCount: 1,
            trialInterval: 'MONTH',
            trialIntervalCount: 2,
          },
        },
      });

      expect(errors[0]?.extensions.code).toEqual('NoPermissionError');
    });
  });
  describe('Mutation.updateProductPlan for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation updateProductPlan(
            $productId: ID!
            $plan: UpdateProductPlanInput!
          ) {
            updateProductPlan(productId: $productId, plan: $plan) {
              _id
            }
          }
        `,
        variables: {
          productId: PlanProduct._id,
          plan: {
            usageCalculationType: 'LICENSED',
            billingInterval: 'WEEK',
            billingIntervalCount: 1,
            trialInterval: 'MONTH',
            trialIntervalCount: 2,
          },
        },
      });
      expect(errors[0]?.extensions.code).toEqual('NoPermissionError');
    });
  });

  describe('query.product for admin user should', () => {
    it('return single product specified by the id', async () => {
      const {
        data: { product },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
              sequence
              status
              tags
              created
              updated
              published
              media(limit: 1) {
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
              texts {
                _id
                locale
                title
                subtitle
                description
              }
              siblings {
                _id
              }
            }
          }
        `,
        variables: {
          productId: 'simpleproduct',
        },
      });

      expect(product._id).toEqual('simpleproduct');
    });

    it('return single product specified by id with single media file', async () => {
      const {
        data: { product },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
              media(limit: 1) {
                _id
                tags
                file {
                  _id
                }
                sortKey
                texts {
                  _id
                }
              }
            }
          }
        `,
        variables: {
          productId: 'simpleproduct',
        },
      });

      expect(product.media.length).toEqual(1);
    });

    it('return single product specified by the id', async () => {
      const {
        data: { product },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
            }
          }
        `,
        variables: {
          slug: 'old-slug-de',
        },
      });

      expect(product._id).toEqual('simpleproduct');
    });

    it('return ProductNotFound error when passed non existing product ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
            }
          }
        `,
        variables: {
          productId: 'non-existing-ID',
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return InvalidIdError error when passed neither productId or slug', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
            }
          }
        `,
        variables: {},
      });

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('query.product for normal user should', () => {
    it('return single product specified by the id', async () => {
      const {
        data: { product },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
            }
          }
        `,
        variables: {
          productId: 'simpleproduct',
        },
      });

      expect(product._id).toEqual('simpleproduct');
    });

    it('return single product specified by id with single media file', async () => {
      const {
        data: { product },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
              media(limit: 1) {
                _id
                tags
                file {
                  _id
                }
                sortKey
                texts {
                  _id
                }
              }
            }
          }
        `,
        variables: {
          productId: 'simpleproduct',
        },
      });

      expect(product.media.length).toEqual(1);
    });

    it('return single product specified by the id', async () => {
      const {
        data: { product },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
            }
          }
        `,
        variables: {
          slug: 'old-slug-de',
        },
      });

      expect(product._id).toEqual('simpleproduct');
    });

    it('return ProductNotFound error when passed non existing slug', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
            }
          }
        `,
        variables: {
          slug: 'non-existing-slug',
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return InvalidIdError error when passed neither productId or slug', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
            }
          }
        `,
        variables: {},
      });

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('query.product for anonymous user should', () => {
    it('return single product specified by the id', async () => {
      const {
        data: { product },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
            }
          }
        `,
        variables: {
          productId: 'simpleproduct',
        },
      });

      expect(product._id).toEqual('simpleproduct');
    });

    it('return single product specified by id with single media file', async () => {
      const {
        data: { product },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
              media(limit: 1) {
                _id
                tags
                file {
                  _id
                }
                sortKey
                texts {
                  _id
                }
              }
            }
          }
        `,
        variables: {
          productId: 'simpleproduct',
        },
      });

      expect(product.media.length).toEqual(1);
    });

    it('return single product specified by the id', async () => {
      const {
        data: { product },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
            }
          }
        `,
        variables: {
          slug: 'old-slug-de',
        },
      });

      expect(product._id).toEqual('simpleproduct');
    });

    it('return ProductNotFound error when passed non existing slug', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
            }
          }
        `,
        variables: {
          slug: 'non-existing-slug',
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return InvalidIdError error when passed neither productId or slug', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
            }
          }
        `,
        variables: {},
      });

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('query.products for admin user should', () => {
    it('return list of products when no argument is passed', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
              sequence
              status
              tags
              created
              updated
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
              meta
              assortmentPaths {
                assortmentProduct {
                  _id
                }
                links {
                  assortmentId
                }
              }
              siblings {
                _id
              }
            }
          }
        `,
        variables: {},
      });

      expect(products.length).toEqual(4);
    });

    it('return only list of products that include a slug', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {
          slugs: ['old-slug-de'],
        },
      });

      expect(products.length).toEqual(3);
    });

    it('return only list of products that include the tags specified', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {
          tags: ['tag-1'],
        },
      });

      expect(products.length).toEqual(3);
    });

    it('if both slug and tags are provided slugs should take precidence for the result ', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {
          tags: ['test-tag'],
          slugs: ['test-slug'],
        },
      });

      expect(products.length).toEqual(2);
    });

    it('return number of product if limit is specified as argument', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {
          limit: 1,
        },
      });

      expect(products.length).toEqual(1);
    });

    it('include draft/configurable products if includeDrafts argument is passed as true', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {
          includeDrafts: true,
        },
      });

      expect(products.length).toEqual(5);
    });
  });

  describe('query.products for normal user should', () => {
    it('return list of products when no argument is passed', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {},
      });

      expect(products.length).toEqual(4);
    });

    it('return only list of products that include a slug', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {
          slugs: ['old-slug-de'],
        },
      });

      expect(products.length).toEqual(3);
    });

    it('return only list of products that include the tags specified', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {
          tags: ['tag-1'],
        },
      });

      expect(products.length).toEqual(3);
    });

    it('if both slug and tags are provided slugs should take precidence for the result ', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {
          tags: ['test-tag'],
          slugs: ['test-slug'],
        },
      });

      expect(products.length).toEqual(2);
    });

    it('return number of product if limit is specified as argument', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {
          limit: 1,
        },
      });

      expect(products.length).toEqual(1);
    });

    it('return NoPermissionError if includeDrafts is set to true', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {
          includeDrafts: true,
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });

    it('not return error if includeDrafts is set to false (default value)', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {
          includeDrafts: false,
        },
      });

      expect(errors).toEqual(undefined);
    });
  });

  describe('query.products for normal user should', () => {
    it('return list of products when no argument is passed', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {},
      });

      expect(products.length).toEqual(4);
    });

    it('return only list of products that include a slug', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {
          slugs: ['old-slug-de'],
        },
      });

      expect(products.length).toEqual(3);
    });

    it('return only list of products that include the tags specified', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {
          tags: ['tag-1'],
        },
      });

      expect(products.length).toEqual(3);
    });

    it('if both slug and tags are provided slugs should take precidence for the result ', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {
          tags: ['test-tag'],
          slugs: ['test-slug'],
        },
      });

      expect(products.length).toEqual(2);
    });

    it('return number of product if limit is specified as argument', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {
          limit: 1,
        },
      });

      expect(products.length).toEqual(1);
    });

    it('return NoPermissionError if includeDrafts is set to true', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {
          includeDrafts: true,
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });

    it('not return error if includeDrafts is set to false (default value)', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query products(
            $tags: [String!]
            $slugs: [String!]
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {
          includeDrafts: false,
        },
      });

      expect(errors).toEqual(undefined);
    });
  });
});
