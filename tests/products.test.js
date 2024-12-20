import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import {
  PlanProduct,
  SimpleProduct,
  SimpleProductDraft,
  ProxySimpleProduct1,
  UnpublishedProduct,
  ProxyProduct,
  ProxyPlanProduct1,
} from './seeds/products.js';

let graphqlFetchAsAdmin;
let graphqlFetchAsNormalUser;
let graphqlFetchAsAnonymousUser;

describe('Products', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetchAsAdmin = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = await createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = await createAnonymousGraphqlFetch();
  });

  describe('Mutation.createProduct', () => {
    it('create a new product', async () => {
      const { data: { createProduct } = {} } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation createProduct($product: CreateProductInput!, $texts: [ProductTextInput!]) {
            createProduct(product: $product, texts: $texts) {
              status
              tags
              texts {
                title
              }
              ... on SimpleProduct {
                catalogPrice {
                  amount
                  currency
                }
                simulatedPrice {
                  amount
                  currency
                }
              }
            }
          }
        `,
        variables: {
          product: {
            type: 'SimpleProduct',
            tags: ['simple'],
          },
          texts: [{ title: 'Simple Product', locale: 'de' }],
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
          mutation UpdateProduct($productId: ID!, $product: UpdateProductInput!) {
            updateProduct(productId: $productId, product: $product) {
              _id
              sequence
              tags
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
      });
    });

    it('return not found error when passed non-existing product id', async () => {
      const { errors = {} } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation UpdateProduct($productId: ID!, $product: UpdateProductInput!) {
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
          mutation UpdateProduct($productId: ID!, $product: UpdateProductInput!) {
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
    it('remove product completely when passed valid product ID ', async () => {
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
          productId: SimpleProductDraft._id,
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
          productId: SimpleProductDraft._id,
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
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
          mutation updateProductPlan($productId: ID!, $plan: UpdateProductPlanInput!) {
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
            billingInterval: 'MONTHS',
            billingIntervalCount: 1,
            trialInterval: 'WEEKS',
            trialIntervalCount: 2,
          },
        },
      });

      expect(updateProductPlan).toMatchObject({
        _id: PlanProduct._id,
        plan: {
          usageCalculationType: 'METERED',
          billingInterval: 'MONTHS',
          billingIntervalCount: 1,
          trialInterval: 'WEEKS',
          trialIntervalCount: 2,
        },
      });
    });

    it('return error when passed non PLAN_PRODUCT type', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation updateProductPlan($productId: ID!, $plan: UpdateProductPlanInput!) {
            updateProductPlan(productId: $productId, plan: $plan) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          plan: {
            usageCalculationType: 'METERED',
            billingInterval: 'MONTHS',
            billingIntervalCount: 1,
            trialInterval: 'WEEKS',
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
          mutation updateProductPlan($productId: ID!, $plan: UpdateProductPlanInput!) {
            updateProductPlan(productId: $productId, plan: $plan) {
              _id
            }
          }
        `,
        variables: {
          productId: 'non-existing-id',
          plan: {
            usageCalculationType: 'METERED',
            billingInterval: 'MONTHS',
            billingIntervalCount: 1,
            trialInterval: 'WEEKS',
            trialIntervalCount: 2,
          },
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return InvalidIdError when passed invalid product ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation updateProductPlan($productId: ID!, $plan: UpdateProductPlanInput!) {
            updateProductPlan(productId: $productId, plan: $plan) {
              _id
            }
          }
        `,
        variables: {
          productId: '',
          plan: {
            usageCalculationType: 'METERED',
            billingInterval: 'MONTHS',
            billingIntervalCount: 1,
            trialInterval: 'WEEKS',
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
          mutation updateProductPlan($productId: ID!, $plan: UpdateProductPlanInput!) {
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
            billingInterval: 'WEEKS',
            billingIntervalCount: 1,
            trialInterval: 'MONTHS',
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
          mutation updateProductPlan($productId: ID!, $plan: UpdateProductPlanInput!) {
            updateProductPlan(productId: $productId, plan: $plan) {
              _id
            }
          }
        `,
        variables: {
          productId: PlanProduct._id,
          plan: {
            usageCalculationType: 'LICENSED',
            billingInterval: 'WEEKS',
            billingIntervalCount: 1,
            trialInterval: 'MONTHS',
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
                  amount
                  currency
                }
                catalogPrice {
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
      expect(product?.simulatedPrice).toMatchObject({
        currency: 'CHF',
        amount: 10000,
      });
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
      expect(product?.simulatedPrice).toMatchObject({
        currency: 'CHF',
        amount: 10000,
      });
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
            $tags: [LowerCaseString!]
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
            $tags: [LowerCaseString!]
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

    it('Search an product using product slug', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query products(
            $tags: [LowerCaseString!]
            $slugs: [String!]
            $queryString: String
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              queryString: $queryString
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {
          queryString: 'search-purpose',
          includeDrafts: true,
        },
      });

      expect(products.length).toEqual(2);
    });

    it('Search an product using product sku', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query products(
            $tags: [LowerCaseString!]
            $slugs: [String!]
            $queryString: String
            $limit: Int
            $offset: Int
            $includeDrafts: Boolean
          ) {
            products(
              tags: $tags
              slugs: $slugs
              queryString: $queryString
              limit: $limit
              offset: $offset
              includeDrafts: $includeDrafts
            ) {
              _id
            }
          }
        `,
        variables: {
          queryString: 'SKU-test',
        },
      });

      expect(products.length).toEqual(4);
    });

    it('return only list of products that include the tags specified', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query products(
            $tags: [LowerCaseString!]
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

    it('return number of product if limit is specified as argument', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query products(
            $tags: [LowerCaseString!]
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
            $tags: [LowerCaseString!]
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
              status
            }
          }
        `,
        variables: {
          includeDrafts: true,
        },
      });

      expect(products.length).toEqual(10);
      expect(products.filter((p) => p.status === 'DRAFT').length).not.toBe(0);
    });
  });

  describe('query.productsCount for admin user should', () => {
    it('return total number of products when no argument is passed', async () => {
      const {
        data: { productsCount },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query productsCount($tags: [LowerCaseString!], $slugs: [String!], $includeDrafts: Boolean) {
            productsCount(tags: $tags, slugs: $slugs, includeDrafts: $includeDrafts)
          }
        `,
        variables: {},
      });

      expect(productsCount).toEqual(11);
    });

    it('return only total number of products that include a slug', async () => {
      const {
        data: { productsCount },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query productsCount($tags: [LowerCaseString!], $slugs: [String!], $includeDrafts: Boolean) {
            productsCount(tags: $tags, slugs: $slugs, includeDrafts: $includeDrafts)
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
          query productsCount($tags: [LowerCaseString!], $slugs: [String!], $includeDrafts: Boolean) {
            productsCount(tags: $tags, slugs: $slugs, includeDrafts: $includeDrafts)
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
          query productsCount($tags: [LowerCaseString!], $slugs: [String!], $includeDrafts: Boolean) {
            productsCount(tags: $tags, slugs: $slugs, includeDrafts: $includeDrafts)
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
          query productsCount($tags: [LowerCaseString!], $slugs: [String!], $includeDrafts: Boolean) {
            productsCount(tags: $tags, slugs: $slugs, includeDrafts: $includeDrafts)
          }
        `,
        variables: {},
      });

      expect(productsCount).toEqual(11);
    });
  });
  describe('query.productsCount for normal user should', () => {
    it('return total number of products when no argument is passed', async () => {
      const {
        data: { productsCount },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query productsCount($tags: [LowerCaseString!], $slugs: [String!], $includeDrafts: Boolean) {
            productsCount(tags: $tags, slugs: $slugs, includeDrafts: $includeDrafts)
          }
        `,
        variables: {},
      });

      expect(productsCount).toEqual(11);
    });
  });

  describe('query.products for normal user should', () => {
    it('return list of products when no argument is passed', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query products(
            $tags: [LowerCaseString!]
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
            $tags: [LowerCaseString!]
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
            $tags: [LowerCaseString!]
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

    it('return number of product if limit is specified as argument', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query products(
            $tags: [LowerCaseString!]
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
            $tags: [LowerCaseString!]
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
            $tags: [LowerCaseString!]
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

  describe('query.products for anonymous user should', () => {
    it('return list of products when no argument is passed', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query products(
            $tags: [LowerCaseString!]
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
            $tags: [LowerCaseString!]
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
            $tags: [LowerCaseString!]
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

    it('return number of product if limit is specified as argument', async () => {
      const {
        data: { products },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query products(
            $tags: [LowerCaseString!]
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
            $tags: [LowerCaseString!]
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
            $tags: [LowerCaseString!]
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
                  amount
                }
                leveledCatalogPrices {
                  minQuantity
                  maxQuantity
                  price {
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
                  amount
                }
                leveledCatalogPrices {
                  minQuantity
                  maxQuantity
                  price {
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

  describe('query.products.simulatedPriceRange should', () => {
    it('return minimum and maximum simulated price range of a configurable product', async () => {
      const {
        data: { product = {} },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query simulatedPriceRange($productId: ID!) {
            product(productId: $productId) {
              _id
              status
              ... on ConfigurableProduct {
                simulatedPriceRange {
                  minPrice {
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                  maxPrice {
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
          query simulatedPriceRange($productId: ID!) {
            product(productId: $productId) {
              _id
              status
              ... on ConfigurableProduct {
                simulatedPriceRange(quantity: 5) {
                  minPrice {
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                  maxPrice {
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
          query simulatedPriceRange($productId: ID!) {
            product(productId: $productId) {
              _id
              status
              ... on ConfigurableProduct {
                simulatedPriceRange(vectors: [{ key: "color-variant", value: "color-variant-red" }]) {
                  minPrice {
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                  maxPrice {
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
          amount: 1500000,
          currency: 'CHF',
        },
        maxPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 10000000,
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
          query simulatedPriceRange($productId: ID!) {
            product(productId: $productId) {
              _id
              status
              ... on ConfigurableProduct {
                catalogPriceRange {
                  minPrice {
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                  maxPrice {
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
          query simulatedPriceRange($productId: ID!) {
            product(productId: $productId) {
              _id
              status
              ... on ConfigurableProduct {
                catalogPriceRange(quantity: 5) {
                  minPrice {
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                  maxPrice {
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
          query simulatedPriceRange($productId: ID!) {
            product(productId: $productId) {
              _id
              status
              ... on ConfigurableProduct {
                catalogPriceRange(vectors: [{ key: "color-variant", value: "color-variant-red" }]) {
                  minPrice {
                    isTaxable
                    isNetPrice
                    amount
                    currency
                  }
                  maxPrice {
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
          amount: 1500000,
          currency: 'CHF',
        },
        maxPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 10000000,
          currency: 'CHF',
        },
      });
    });
  });
});
