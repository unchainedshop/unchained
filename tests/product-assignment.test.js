import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import { SimpleProduct, ProxyProduct, ConfigurableProduct, PlanProduct } from './seeds/products.js';

test.describe('Product: Assignments', async () => {
  let graphqlFetchAsAdmin;
  let graphqlFetchAsNormalUser;
  let graphqlAnonymousFetch;

  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlAnonymousFetch = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('mutation.addProductAssignment for admin user should', async () => {
    test('Throw error when incomplete/invalid vectors is passed', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation AddProductAssignment(
            $proxyId: ID!
            $productId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
            addProductAssignment(proxyId: $proxyId, productId: $productId, vectors: $vectors) {
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
              siblings {
                _id
              }
              ... on ConfigurableProduct {
                products {
                  _id
                }
                assortmentPaths {
                  links {
                    link {
                      _id
                      parent {
                        _id
                        productAssignments {
                          _id
                          product {
                            _id
                          }
                        }
                      }
                    }
                  }
                }
                variations {
                  _id
                  key
                  texts {
                    title
                  }
                }
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          proxyId: ProxyProduct._id,
          vectors: [{ key: 'non-existing', value: 'text-variant-a' }],
        },
      });
      assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
        code: 'ProductVariationVectorInvalid',
      });
    });
    test('assign proxy to a product when passed valid proxy, product ID and CONFIGURABLE_PRODUCT type', async () => {
      const { data: { addProductAssignment } = {} } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation AddProductAssignment(
            $proxyId: ID!
            $productId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
            addProductAssignment(proxyId: $proxyId, productId: $productId, vectors: $vectors) {
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
              siblings {
                _id
              }
              ... on ConfigurableProduct {
                products {
                  _id
                }
                assortmentPaths {
                  links {
                    link {
                      _id
                      parent {
                        _id
                        productAssignments {
                          _id
                          product {
                            _id
                          }
                        }
                      }
                    }
                  }
                }
                variations {
                  _id
                  key
                  texts {
                    title
                  }
                }
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          proxyId: ConfigurableProduct._id,
          vectors: [
            { key: 'key-1', value: 'value-1' },
            { key: 'key-2', value: 'value-2' },
            { key: 'key-3', value: 'value-3' },
          ],
        },
      });

      assert.deepStrictEqual(addProductAssignment.products?.[0], {
        _id: SimpleProduct._id,
      });
    });

    test('return error when passed non CONFIGURABLE_PRODUCT type', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation AddProductAssignment(
            $proxyId: ID!
            $productId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
            addProductAssignment(proxyId: $proxyId, productId: $productId, vectors: $vectors) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          proxyId: PlanProduct._id,
          vectors: [
            { key: 'key-1', value: 'value-1' },
            { key: 'key-2', value: 'value-2' },
            { key: 'key-3', value: 'value-3' },
          ],
        },
      });
      assert.deepStrictEqual(errors?.[0]?.extensions, {
        proxyId: PlanProduct._id,
        code: 'ProductWrongTypeError',
        received: PlanProduct.type,
        required: 'CONFIGURABLE_PRODUCT',
      });
    });

    test('return not found error when passed non existing product ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation AddProductAssignment(
            $proxyId: ID!
            $productId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
            addProductAssignment(proxyId: $proxyId, productId: $productId, vectors: $vectors) {
              _id
            }
          }
        `,
        variables: {
          productId: 'non-existin-product-id',
          proxyId: ConfigurableProduct._id,
          vectors: [
            { key: 'key-1', value: 'value-1' },
            { key: 'key-2', value: 'value-2' },
            { key: 'key-3', value: 'value-3' },
          ],
        },
      });

      assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
        code: 'ProductNotFoundError',
      });
    });

    test('return not found error when passed non existing proxy ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation AddProductAssignment(
            $proxyId: ID!
            $productId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
            addProductAssignment(proxyId: $proxyId, productId: $productId, vectors: $vectors) {
              _id
            }
          }
        `,
        variables: {
          productId: ConfigurableProduct._id,
          proxyId: 'non-exsisting-proxy-id',
          vectors: [
            { key: 'key-1', value: 'value-1' },
            { key: 'key-2', value: 'value-2' },
            { key: 'key-3', value: 'value-3' },
          ],
        },
      });
      assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
        code: 'ProductNotFoundError',
      });
    });

    test('return error when passed invalid product ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation AddProductAssignment(
            $proxyId: ID!
            $productId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
            addProductAssignment(proxyId: $proxyId, productId: $productId, vectors: $vectors) {
              _id
            }
          }
        `,
        variables: {
          productId: '',
          proxyId: ConfigurableProduct._id,
          vectors: [
            { key: 'key-1', value: 'value-1' },
            { key: 'key-2', value: 'value-2' },
            { key: 'key-3', value: 'value-3' },
          ],
        },
      });

      assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
        code: 'InvalidIdError',
      });
    });

    test('return error when passed invalid proxy ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation AddProductAssignment(
            $proxyId: ID!
            $productId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
            addProductAssignment(proxyId: $proxyId, productId: $productId, vectors: $vectors) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          proxyId: '',
          vectors: [
            { key: 'key-1', value: 'value-1' },
            { key: 'key-2', value: 'value-2' },
            { key: 'key-3', value: 'value-3' },
          ],
        },
      });
      assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
        code: 'InvalidIdError',
      });
    });
  });

  test.describe('mutation.addProductAssignment for logged in user should', async () => {
    test('return error', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation AddProductAssignment(
            $proxyId: ID!
            $productId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
            addProductAssignment(proxyId: $proxyId, productId: $productId, vectors: $vectors) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          proxyId: ConfigurableProduct._id,
          vectors: [
            { key: 'key-1', value: 'value-1' },
            { key: 'key-2', value: 'value-2' },
            { key: 'key-3', value: 'value-3' },
          ],
        },
      });

      assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
        code: 'NoPermissionError',
      });
    });
  });

  test.describe('mutation.addProductAssignment for anonymous user should', async () => {
    test('return error', async () => {
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation AddProductAssignment(
            $proxyId: ID!
            $productId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
            addProductAssignment(proxyId: $proxyId, productId: $productId, vectors: $vectors) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          proxyId: ConfigurableProduct._id,
          vectors: [
            { key: 'key-1', value: 'value-1' },
            { key: 'key-2', value: 'value-2' },
            { key: 'key-3', value: 'value-3' },
          ],
        },
      });

      assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
        code: 'NoPermissionError',
      });
    });
  });

  test.describe('mutation.removeProductAssignment for admin user should', async () => {
    test('Update proxy to a product when passed valid proxy  ID of CONFIGURABLE_PRODUCT type', async () => {
      const { data: { removeProductAssignment } = {} } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation RemoveProductAssignment($proxyId: ID!, $vectors: [ProductAssignmentVectorInput!]!) {
            removeProductAssignment(proxyId: $proxyId, vectors: $vectors) {
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
                links {
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
          proxyId: ConfigurableProduct._id,
          vectors: [{ key: 'key-3', value: 'value-3' }],
        },
      });
      assert.strictEqual(removeProductAssignment._id, ConfigurableProduct._id);
    });

    test('return error when passed non CONFIGURABLE_PRODUCT type id', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation RemoveProductAssignment($proxyId: ID!, $vectors: [ProductAssignmentVectorInput!]!) {
            removeProductAssignment(proxyId: $proxyId, vectors: $vectors) {
              _id
            }
          }
        `,
        variables: {
          proxyId: SimpleProduct._id,
          vectors: [{ key: 'key-3', value: 'value-3' }],
        },
      });

      assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
        code: 'ProductWrongTypeError',
        received: SimpleProduct.type,
        required: 'CONFIGURABLE_PRODUCT',
      });
    });

    test('return not found error when passed non existing proxy  ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation RemoveProductAssignment($proxyId: ID!, $vectors: [ProductAssignmentVectorInput!]!) {
            removeProductAssignment(proxyId: $proxyId, vectors: $vectors) {
              _id
            }
          }
        `,
        variables: {
          proxyId: 'invalid-proxy-id',
          vectors: [{ key: 'key-3', value: 'value-3' }],
        },
      });

      assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
        code: 'ProductNotFoundError',
      });
    });

    test('return error when passed invalid valid proxy  ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation RemoveProductAssignment($proxyId: ID!, $vectors: [ProductAssignmentVectorInput!]!) {
            removeProductAssignment(proxyId: $proxyId, vectors: $vectors) {
              _id
            }
          }
        `,
        variables: {
          proxyId: '',
          vectors: [{ key: 'key-3', value: 'value-3' }],
        },
      });
      assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
        code: 'InvalidIdError',
      });
    });
  });

  test.describe('mutation.removeProductAssignment for normal user should', async () => {
    test('return error', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation RemoveProductAssignment($proxyId: ID!, $vectors: [ProductAssignmentVectorInput!]!) {
            removeProductAssignment(proxyId: $proxyId, vectors: $vectors) {
              _id
            }
          }
        `,
        variables: {
          proxyId: ConfigurableProduct._id,
          vectors: [{ key: 'key-3', value: 'value-3' }],
        },
      });

      assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
        code: 'NoPermissionError',
      });
    });
  });

  test.describe('mutation.removeProductAssignment for anonymous user should', async () => {
    test('return error', async () => {
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation RemoveProductAssignment($proxyId: ID!, $vectors: [ProductAssignmentVectorInput!]!) {
            removeProductAssignment(proxyId: $proxyId, vectors: $vectors) {
              _id
            }
          }
        `,
        variables: {
          proxyId: ConfigurableProduct._id,
          vectors: [{ key: 'key-3', value: 'value-3' }],
        },
      });

      assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
        code: 'NoPermissionError',
      });
    });
  });
});
