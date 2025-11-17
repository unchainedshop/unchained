import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
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
import assert from 'node:assert';
import test from 'node:test';

let graphqlFetchAsAdmin;
let graphqlFetchAsNormalUser;
let graphqlFetchAsAnonymousUser;

test.describe('Products', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('query.productsCount for admin user should', () => {
    test('return total number of products when no argument is passed', async () => {
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

      assert.strictEqual(productsCount, 12);
    });

    test('return only total number of products that include a slug', async () => {
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

      assert.strictEqual(productsCount, 3);
    });

    test('return only total number of products that include the tags specified', async () => {
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

      assert.strictEqual(productsCount, 5);
    });

    test('include draft products if includeDrafts argument is passed as true', async () => {
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

      assert.ok(productsCount >= 12);
    });
  });

  test.describe('query.productsCount for anonymous user should', () => {
    test('return total number of products when no argument is passed', async () => {
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

      assert.strictEqual(productsCount, 12);
    });
  });

  test.describe('query.productsCount for normal user should', () => {
    test('return total number of products when no argument is passed', async () => {
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

      assert.strictEqual(productsCount, 12);
    });
  });

  test.describe('Mutation.createProduct', () => {
    test('create a new product', async () => {
      const result = await graphqlFetchAsAdmin({
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
                  currencyCode
                }
                simulatedPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
        `,
        variables: {
          product: {
            type: 'SIMPLE_PRODUCT',
            tags: ['simple'],
          },
          texts: [{ title: 'Simple Product', locale: 'de' }],
        },
      });
      const { data: { createProduct } = {} } = result;
      assert.deepStrictEqual(createProduct, {
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

  test.describe('Mutation.unpublishProduct', () => {
    test('unpublish product', async () => {
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

      assert.strictEqual(unpublishProduct.published, null);
    });

    test('return not found error for non-existing product id', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return error for invalid product id', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.publishProduct', () => {
    test('publish product', async () => {
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
      assert.partialDeepStrictEqual(data?.publishProduct, {
        _id: UnpublishedProduct._id,
        status: 'ACTIVE',
      });
    });

    test('return not found error for non-existing product id', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return error for non-existing product id', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Mutation.updateProduct should', () => {
    test('update successfuly when passed valid product ID ', async () => {
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

      assert.deepStrictEqual(updateProduct, {
        _id: 'simpleproduct',
        sequence: 1,
        tags: ['tag-1', 'tag-2', 'highlight', 'update-tag'],
      });
    });

    test('return not found error when passed non-existing product id', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return error when passed invalid product id', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Mutation.removeProduct should', () => {
    test('remove product completely when passed valid product ID ', async () => {
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

      assert.strictEqual(removeProduct.status, 'DELETED');
    });

    test('return error when attempting to delete already removed product ', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return not found error when passed non-existing product id', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return error when passed invalid product id', async () => {
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

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Mutation.updateProductPlan for admin user should', () => {
    test('update product plan successfuly when passed PLAN_PRODUCT type', async () => {
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

      assert.partialDeepStrictEqual(updateProductPlan, {
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

    test('return error when passed non PLAN_PRODUCT type', async () => {
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

      assert.deepStrictEqual(errors?.[0]?.extensions, {
        code: 'ProductWrongStatusError',
        received: SimpleProduct.type,
        required: 'PLAN_PRODUCT',
      });
    });

    test('return ProductNotFoundError when passed product ID that does not exist', async () => {
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

      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return InvalidIdError when passed invalid product ID', async () => {
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

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Mutation.updateProductPlan for normal user should', () => {
    test('return NoPermissionError', async () => {
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

      assert.strictEqual(errors[0]?.extensions.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.updateProductPlan for anonymous user should', () => {
    test('return NoPermissionError', async () => {
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
      assert.strictEqual(errors[0]?.extensions.code, 'NoPermissionError');
    });
  });

  test.describe('query.product for admin user should', () => {
    test('return single product specified by the id', async () => {
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

      assert.strictEqual(product._id, 'simpleproduct');
    });

    test('return product price with the default price when no argument is passed to simulatedPrice  of SIMPLE_PRODUCT type', async () => {
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
                  currencyCode
                }
                catalogPrice {
                  isTaxable
                  isNetPrice
                  amount
                  currencyCode
                }
              }
            }
          }
        `,
        variables: {
          productId: 'simpleproduct',
        },
      });
      assert.deepStrictEqual(product?.simulatedPrice, {
        currencyCode: 'CHF',
        amount: 10000,
      });
    });

    test('return null when passed unsupported currency to simulatedPrice of SIMPLE_PRODUCT type', async () => {
      const {
        data: { product },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
              ... on SimpleProduct {
                simulatedPrice(currencyCode: "ETB") {
                  amount
                  currencyCode
                }
              }
            }
          }
        `,
        variables: {
          productId: 'simpleproduct',
        },
      });

      assert.strictEqual(product?.simulatedPrice, null);
    });

    test('return product price with the default price when no argument is passed to simulatedPrice  of PLAN_PRODUCT type', async () => {
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
                  currencyCode
                }
              }
            }
          }
        `,
        variables: {
          productId: 'plan-product',
        },
      });
      assert.deepStrictEqual(product?.simulatedPrice, {
        currencyCode: 'CHF',
        amount: 10000,
      });
    });

    test('return null when passed unsupported currency to simulatedPrice of PLAN_PRODUCT type', async () => {
      const {
        data: { product },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query product($productId: ID, $slug: String) {
            product(productId: $productId, slug: $slug) {
              _id
              ... on PlanProduct {
                simulatedPrice(currencyCode: "ETB") {
                  amount
                  currencyCode
                }
              }
            }
          }
        `,
        variables: {
          productId: 'plan-product',
        },
      });

      assert.strictEqual(product?.simulatedPrice, null);
    });

    test('return single product specified by id with single media file', async () => {
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

      assert.strictEqual(product.media.length, 1);
    });

    test('return single product specified by the id', async () => {
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

      assert.strictEqual(product._id, 'simpleproduct');
    });

    test('return InvalidIdError error when passed neither productId or slug', async () => {
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

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('query.product for normal user should', () => {
    test('return single product specified by the id', async () => {
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

      assert.strictEqual(product._id, 'simpleproduct');
    });

    test('return single product specified by id with single media file', async () => {
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

      assert.strictEqual(product.media.length, 1);
    });

    test('return single product specified by the id', async () => {
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

      assert.strictEqual(product._id, 'simpleproduct');
    });

    test('return InvalidIdError error when passed neither productId or slug', async () => {
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

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('query.product for anonymous user should', () => {
    test('return single product specified by the id', async () => {
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

      assert.strictEqual(product._id, 'simpleproduct');
    });

    test('return single product specified by id with single media file', async () => {
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

      assert.strictEqual(product.media.length, 1);
    });

    test('return single product specified by the id', async () => {
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

      assert.strictEqual(product._id, 'simpleproduct');
    });

    test('return InvalidIdError error when passed neither productId or slug', async () => {
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

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('query.products for admin user should', () => {
    test('return list of products when no argument is passed', async () => {
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

      assert.strictEqual(products.length, 10);
    });

    test('return only list of products that include a slug', async () => {
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

      assert.strictEqual(products.length, 3);
    });

    test('Search an product using product slug', async () => {
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

      assert.strictEqual(products.length, 3);
    });

    test('Search an product using product sku', async () => {
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

      assert.strictEqual(products.length, 6);
    });

    test('return only list of products that include the tags specified', async () => {
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

      assert.strictEqual(products.length, 5);
    });

    test('return number of product if limit is specified as argument', async () => {
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

      assert.strictEqual(products.length, 1);
    });

    test('include draft/configurable products if includeDrafts argument is passed as true', async () => {
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

      assert.strictEqual(products.length, 10);
      assert.notStrictEqual(products.filter((p) => p.status === 'DRAFT').length, 0);
    });
  });

  test.describe('query.products for normal user should', () => {
    test('return list of products when no argument is passed', async () => {
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

      assert.strictEqual(products.length, 10);
    });

    test('return only list of products that include a slug', async () => {
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

      assert.strictEqual(products.length, 3);
    });

    test('return only list of products that include the tags specified', async () => {
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

      assert.strictEqual(products.length, 5);
    });

    test('return number of product if limit is specified as argument', async () => {
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

      assert.strictEqual(products.length, 1);
    });

    test('return NoPermissionError if includeDrafts is set to true', async () => {
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

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });

    test('not return error if includeDrafts is set to false (default value)', async () => {
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

      assert.strictEqual(errors, undefined);
    });
  });

  test.describe('query.products for anonymous user should', () => {
    test('return list of products when no argument is passed', async () => {
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

      assert.strictEqual(products.length, 10);
    });

    test('return only list of products that include a slug', async () => {
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

      assert.strictEqual(products.length, 3);
    });

    test('return only list of products that include the tags specified', async () => {
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

      assert.strictEqual(products.length, 5);
    });

    test('return number of product if limit is specified as argument', async () => {
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

      assert.strictEqual(products.length, 1);
    });

    test('return NoPermissionError if includeDrafts is set to true', async () => {
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

      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });

    test('not return error if includeDrafts is set to false (default value)', async () => {
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

      assert.strictEqual(errors, undefined);
    });
  });

  test.describe('query.products.leveleCatalogPrice should', () => {
    test('return catalog price list of a SIMPLE_PRODUCT product type  ', async () => {
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
                    currencyCode
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
      assert.strictEqual(product.leveledCatalogPrices?.length, 3);
    });

    test('return catalog price list of a for PLAN_PRODUCT product type', async () => {
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
                    currencyCode
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
      assert.strictEqual(product.leveledCatalogPrices?.length, 3);
    });
  });

  test.describe('query.products.simulatedPriceRange should', () => {
    test('return minimum and maximum simulated price range of a configurable product', async () => {
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
                    currencyCode
                  }
                  maxPrice {
                    isTaxable
                    isNetPrice
                    amount
                    currencyCode
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
      assert.deepStrictEqual(product.simulatedPriceRange, {
        minPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 500000,
          currencyCode: 'CHF',
        },
        maxPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 30000000,
          currencyCode: 'CHF',
        },
      });
    });

    test('return minimum and maximum simulated price range of a configurable product based on quantity argument', async () => {
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
                    currencyCode
                  }
                  maxPrice {
                    isTaxable
                    isNetPrice
                    amount
                    currencyCode
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
      assert.deepStrictEqual(product.simulatedPriceRange, {
        minPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 400000,
          currencyCode: 'CHF',
        },
        maxPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 10000000,
          currencyCode: 'CHF',
        },
      });
    });

    test('return minimum and maximum simulated price range of a configurable product based on vector argument', async () => {
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
                    currencyCode
                  }
                  maxPrice {
                    isTaxable
                    isNetPrice
                    amount
                    currencyCode
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
      assert.deepStrictEqual(product.simulatedPriceRange, {
        minPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 2000000,
          currencyCode: 'CHF',
        },
        maxPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 2000000,
          currencyCode: 'CHF',
        },
      });
    });
  });

  test.describe('query.products.catalogPriceRange should', () => {
    test('return minimum and maximum catalog price range of a configurable product', async () => {
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
                    currencyCode
                  }
                  maxPrice {
                    isTaxable
                    isNetPrice
                    amount
                    currencyCode
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

      assert.deepStrictEqual(product.catalogPriceRange, {
        minPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 2000000,
          currencyCode: 'CHF',
        },
        maxPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 2000000,
          currencyCode: 'CHF',
        },
      });
    });

    test('return minimum and maximum catalog price range of a configurable product based on quantity argument', async () => {
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
                    currencyCode
                  }
                  maxPrice {
                    isTaxable
                    isNetPrice
                    amount
                    currencyCode
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
      assert.deepStrictEqual(product.catalogPriceRange, {
        minPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 400000,
          currencyCode: 'CHF',
        },
        maxPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 10000000,
          currencyCode: 'CHF',
        },
      });
    });

    test('return minimum and maximum catalog price range of a configurable product based on vector argument', async () => {
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
                    currencyCode
                  }
                  maxPrice {
                    isTaxable
                    isNetPrice
                    amount
                    currencyCode
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
      assert.deepStrictEqual(product.catalogPriceRange, {
        minPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 2000000,
          currencyCode: 'CHF',
        },
        maxPrice: {
          isTaxable: true,
          isNetPrice: false,
          amount: 2000000,
          currencyCode: 'CHF',
        },
      });
    });
  });
});
