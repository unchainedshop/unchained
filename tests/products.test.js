import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users';
import {
  PlanProduct,
  SimpleProduct,
  ProxySimpleProduct1,
  UnpublishedProduct,
  ProxyProduct,
  ProxyPlanProduct1,
  ProductPirceInWei,
} from './seeds/products';

let graphqlFetchAsAdmin;
let graphqlFetchAsNormalUser;
let graphqlFetchAsAnonymousUser;

describe('Products', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetchAsAdmin = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = await createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
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
                  amount
                  currency
                }
                simulatedPrice {
                  _id
                  amount
                  currency
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
        });

      expect(updateProduct).toMatchObject({
        _id: 'simpleproduct',
        sequence: 1,
        tags: ['tag-1', 'tag-2', 'highlight', 'update-tag'],
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
    it('update product plan successfuly when passed PLAN_PRODUCT type', async () => {
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

    it('return error when passed non PLAN_PRODUCT type', async () => {
      const { errors } = await graphqlFetchAsAdmin({
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
          productId: SimpleProduct._id,
          plan: {
            usageCalculationType: 'METERED',
            billingInterval: 'MONTH',
            billingIntervalCount: 1,
            trialInterval: 'WEEK',
            trialIntervalCount: 2,
          },
        },
      });

      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'ProductWrongStatusError',
        received: SimpleProduct.type,
        required: 'PLAN_PRODUCT',
      });
    });

    it('return ProductNotFoundError when passed product ID that does not exist', async () => {
      const { errors } = await graphqlFetchAsAdmin({
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
          productId: 'non-existing-id',
          plan: {
            usageCalculationType: 'METERED',
            billingInterval: 'MONTH',
            billingIntervalCount: 1,
            trialInterval: 'WEEK',
            trialIntervalCount: 2,
          },
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return InvalidIdError when passed invalid product ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
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
          productId: '',
          plan: {
            usageCalculationType: 'METERED',
            billingInterval: 'MONTH',
            billingIntervalCount: 1,
            trialInterval: 'WEEK',
            trialIntervalCount: 2,
          },
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
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

    it('return product price with the default price when no argument is passed to simulatedPrice  of SIMPLE_PRODUCT type', async () => {
      const {
        data: { product },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
              tags
              ... on SimpleProduct {
                simulatedPrice {
                  _id
                  amount
                  currency
                }
                catalogPrice {
                  _id
                  isTaxable
                  isNetPrice
                  amount
                  currency
                }
              }
            }
          }
        `,
        variables: {
          productId: 'simpleproduct',
        },
      });

      expect(product?.simulatedPrice?.currency).toEqual('CHF');
    });

    it('return null when passed unsupported currency to simulatedPrice of SIMPLE_PRODUCT type', async () => {
      const {
        data: { product },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
              ... on SimpleProduct {
                simulatedPrice(currency: "ETB") {
                  _id
                  amount
                  currency
                }
              }
            }
          }
        `,
        variables: {
          productId: 'simpleproduct',
        },
      });

      expect(product?.simulatedPrice).toBe(null);
    });

    it('return product price with the default price when no argument is passed to simulatedPrice  of PLAN_PRODUCT type', async () => {
      const {
        data: { product },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
              ... on PlanProduct {
                simulatedPrice {
                  _id
                  amount
                  currency
                }
              }
            }
          }
        `,
        variables: {
          productId: 'plan-product',
        },
      });
      expect(product?.simulatedPrice?.currency).toEqual('CHF');
    });

    it('return null when passed unsupported currency to simulatedPrice of PLAN_PRODUCT type', async () => {
      const {
        data: { product },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
              ... on PlanProduct {
                simulatedPrice(currency: "ETB") {
                  _id
                  amount
                  currency
                }
              }
            }
          }
        `,
        variables: {
          productId: 'plan-product',
        },
      });

      expect(product?.simulatedPrice).toBe(null);
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

      expect(products.length).toEqual(10);
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

      expect(products.length).toEqual(10);
    });
  });

  describe('query.productsCount for admin user should', () => {
    it('return total number of products when no argument is passed', async () => {
      const {
        data: { productsCount },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query productsCount(
            $tags: [String!]
            $slugs: [String!]
            $includeDrafts: Boolean
          ) {
            productsCount(
              tags: $tags
              slugs: $slugs
              includeDrafts: $includeDrafts
            )
          }
        `,
        variables: {},
      });

      expect(productsCount).toEqual(12);
    });

    it('return only total number of products that include a slug', async () => {
      const {
        data: { productsCount },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query productsCount(
            $tags: [String!]
            $slugs: [String!]
            $includeDrafts: Boolean
          ) {
            productsCount(
              tags: $tags
              slugs: $slugs
              includeDrafts: $includeDrafts
            )
          }
        `,
        variables: {
          slugs: ['old-slug-de'],
        },
      });

      expect(productsCount).toEqual(3);
    });

    it('return only total number of products that include the tags specified', async () => {
      const {
        data: { productsCount },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query productsCount(
            $tags: [String!]
            $slugs: [String!]
            $includeDrafts: Boolean
          ) {
            productsCount(
              tags: $tags
              slugs: $slugs
              includeDrafts: $includeDrafts
            )
          }
        `,
        variables: {
          tags: ['tag-1'],
        },
      });

      expect(productsCount).toEqual(3);
    });

    it('include draft products if includeDrafts argument is passed as true', async () => {
      const {
        data: { productsCount },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query productsCount(
            $tags: [String!]
            $slugs: [String!]
            $includeDrafts: Boolean
          ) {
            productsCount(
              tags: $tags
              slugs: $slugs
              includeDrafts: $includeDrafts
            )
          }
        `,
        variables: {
          includeDrafts: true,
        },
      });

      expect(productsCount).toEqual(13);
    });
  });

  describe('query.productsCount for anonymous user should', () => {
    it('return total number of products when no argument is passed', async () => {
      const {
        data: { productsCount },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query productsCount(
            $tags: [String!]
            $slugs: [String!]
            $includeDrafts: Boolean
          ) {
            productsCount(
              tags: $tags
              slugs: $slugs
              includeDrafts: $includeDrafts
            )
          }
        `,
        variables: {},
      });

      expect(productsCount).toEqual(12);
    });
  });
  describe('query.productsCount for normal user should', () => {
    it('return total number of products when no argument is passed', async () => {
      const {
        data: { productsCount },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query productsCount(
            $tags: [String!]
            $slugs: [String!]
            $includeDrafts: Boolean
          ) {
            productsCount(
              tags: $tags
              slugs: $slugs
              includeDrafts: $includeDrafts
            )
          }
        `,
        variables: {},
      });

      expect(productsCount).toEqual(12);
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

      expect(products.length).toEqual(10);
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

      expect(products.length).toEqual(10);
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

  describe('query.products.leveleCatalogPrice should', () => {
    it('return catalog price list of a SIMPLE_PRODUCT product type  ', async () => {
      const {
        data: { product = [] },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query product($productId: ID) {
            product(productId: $productId) {
              _id
              ... on SimpleProduct {
                catalogPrice {
                  _id
                }
                leveledCatalogPrices {
                  minQuantity
                  maxQuantity
                  price {
                    _id
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                }
              }
            }
          }
        `,
        variables: {
          productId: ProxySimpleProduct1._id,
        },
      });
      expect(product.leveledCatalogPrices?.length).toEqual(3);
    });

    it('return catalog price list of a for PLAN_PRODUCT product type', async () => {
      const {
        data: { product = [] },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query product($productId: ID) {
            product(productId: $productId) {
              _id
              ... on PlanProduct {
                catalogPrice {
                  _id
                }
                leveledCatalogPrices {
                  minQuantity
                  maxQuantity
                  price {
                    _id
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                }
              }
            }
          }
        `,
        variables: {
          productId: ProxyPlanProduct1._id,
        },
      });
      expect(product.leveledCatalogPrices?.length).toEqual(3);
    });
  });

  describe('query.products.simulatePriceRange should', () => {
    it('return minimum and maximum simulated price range of a configurable product', async () => {
      const {
        data: { product = {} },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query SimulatedPriceRange($productId: ID!) {
            product(productId: $productId) {
              _id
              status
              ... on ConfigurableProduct {
                simulatedPriceRange {
                  _id
                  minPrice {
                    _id
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                  maxPrice {
                    _id
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                }
              }
            }
          }
        `,
        variables: {
          productId: ProxyProduct._id,
        },
      });
      expect(product.simulatedPriceRange).toMatchObject({
        minPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 500000,
          currency: 'CHF',
        },
        maxPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 30000000,
          currency: 'CHF',
        },
      });
    });

    it('return minimum and maximum simulated price range of a configurable product based on quantity argument', async () => {
      const {
        data: { product = {} },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query SimulatedPriceRange($productId: ID!) {
            product(productId: $productId) {
              _id
              status
              ... on ConfigurableProduct {
                simulatedPriceRange(quantity: 5) {
                  _id
                  minPrice {
                    _id
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                  maxPrice {
                    _id
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                }
              }
            }
          }
        `,
        variables: {
          productId: ProxyProduct._id,
        },
      });
      expect(product.simulatedPriceRange).toMatchObject({
        minPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 400000,
          currency: 'CHF',
        },
        maxPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 75000000,
          currency: 'CHF',
        },
      });
    });

    it('return minimum and maximum simulated price range of a configurable product based on vector argument', async () => {
      const {
        data: { product = {} },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query SimulatedPriceRange($productId: ID!) {
            product(productId: $productId) {
              _id
              status
              ... on ConfigurableProduct {
                simulatedPriceRange(vectors: [{ key: "COLOR", value: "red" }]) {
                  _id
                  minPrice {
                    _id
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                  maxPrice {
                    _id
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                }
              }
            }
          }
        `,
        variables: {
          productId: ProxyProduct._id,
        },
      });
      expect(product.simulatedPriceRange).toMatchObject({
        minPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 500000,
          currency: 'CHF',
        },
        maxPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 1500000,
          currency: 'CHF',
        },
      });
    });
  });

  describe('query.products.catalogPriceRange should', () => {
    it('return minimum and maximum catalog price range of a configurable product', async () => {
      const {
        data: { product = {} },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query SimulatedPriceRange($productId: ID!) {
            product(productId: $productId) {
              _id
              status
              ... on ConfigurableProduct {
                catalogPriceRange {
                  _id
                  minPrice {
                    _id
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                  maxPrice {
                    _id
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                }
              }
            }
          }
        `,
        variables: {
          productId: ProxyProduct._id,
        },
      });
      expect(product.catalogPriceRange).toMatchObject({
        minPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 500000,
          currency: 'CHF',
        },
        maxPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 30000000,
          currency: 'CHF',
        },
      });
    });

    it('return minimum and maximum catalog price range of a configurable product based on quantity argument', async () => {
      const {
        data: { product = {} },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query SimulatedPriceRange($productId: ID!) {
            product(productId: $productId) {
              _id
              status
              ... on ConfigurableProduct {
                catalogPriceRange(quantity: 5) {
                  _id
                  minPrice {
                    _id
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                  maxPrice {
                    _id
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                }
              }
            }
          }
        `,
        variables: {
          productId: ProxyProduct._id,
        },
      });
      expect(product.catalogPriceRange).toMatchObject({
        minPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 400000,
          currency: 'CHF',
        },
        maxPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 75000000,
          currency: 'CHF',
        },
      });
    });

    it('return minimum and maximum catalog price range of a configurable product based on vector argument', async () => {
      const {
        data: { product = {} },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query SimulatedPriceRange($productId: ID!) {
            product(productId: $productId) {
              _id
              status
              ... on ConfigurableProduct {
                catalogPriceRange(vectors: [{ key: "COLOR", value: "red" }]) {
                  _id
                  minPrice {
                    _id
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                  maxPrice {
                    _id
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                }
              }
            }
          }
        `,
        variables: {
          productId: ProxyProduct._id,
        },
      });
      expect(product.catalogPriceRange).toMatchObject({
        minPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 500000,
          currency: 'CHF',
        },
        maxPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 1500000,
          currency: 'CHF',
        },
      });
    });
  });

  describe('mutation.updateProductCommerce should work with large numbers', () => {
    it('update product price to 1 wei', async () => {
      const { data } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation updateProductCommerce(
            $productId: ID!
            $commerce: UpdateProductCommerceInput!
          ) {
            updateProductCommerce(productId: $productId, commerce: $commerce) {
              _id
              ... on SimpleProduct {
                simulatedPrice(currency: "WEI") {
                  _id
                  amount
                }
                catalogPrice(currency: "WEI") {
                  _id
                  amount
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
                amount: 1000000000000000000,
                currencyCode: 'WEI',
                countryCode: 'CH',
              },
            ],
          },
        },
      });
      expect(data.updateProductCommerce).toMatchObject({
        _id: SimpleProduct._id,
        simulatedPrice: {
          _id: expect.anything(),
          amount: 1000000000000000000,
        },
        catalogPrice: {
          _id: expect.anything(),
          amount: 1000000000000000000,
        },
      });
    });
  });

  describe('query.product should ', () => {
    it('return price in WEI', async () => {
      const {
        data: { product = {} },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query PriceInWEI($productId: ID!) {
            product(productId: $productId) {
              _id
              status
              ... on SimpleProduct {
                simulatedPrice(currency: "WEI") {
                  _id
                  amount
                }
                catalogPrice(currency: "WEI") {
                  _id
                  amount
                }
              }
            }
          }
        `,
        variables: {
          productId: ProductPirceInWei._id,
        },
      });
      expect(product).toMatchObject({
        simulatedPrice: {
          _id: expect.anything(),
          amount: ProductPirceInWei.commerce.pricing[0].amount,
        },
        catalogPrice: {
          _id: expect.anything(),
          amount: ProductPirceInWei.commerce.pricing[0].amount,
        },
      });
    });
  });
});
