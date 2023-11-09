import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import {
  SimpleProduct,
  ConfigurableProduct,
  PlanProduct,
} from './seeds/products.js';

let graphqlFetchAsAdmin;
let graphqlFetchAsNormalUser;
let graphqlAnonymousFetch;
describe('ProductAssignment', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetchAsAdmin = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = await createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
  });

  describe('mutation.addProductAssignment for admin user should', () => {
    it('assign proxy to a product when passed valid proxy, product ID and CONFIGURABLE_PRODUCT type', async () => {
      const { data: { addProductAssignment } = {} } = await graphqlFetchAsAdmin(
        {
          query: /* GraphQL */ `
            mutation AddProductAssignment(
              $proxyId: ID!
              $productId: ID!
              $vectors: [ProductAssignmentVectorInput!]!
            ) {
              addProductAssignment(
                proxyId: $proxyId
                productId: $productId
                vectors: $vectors
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
        },
      );

      expect(addProductAssignment.products?.[0]).toMatchObject({
        _id: SimpleProduct._id,
      });
    });

    it('return error when passed non CONFIGURABLE_PRODUCT type', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation AddProductAssignment(
            $proxyId: ID!
            $productId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
            addProductAssignment(
              proxyId: $proxyId
              productId: $productId
              vectors: $vectors
            ) {
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
      expect(errors?.[0]?.extensions).toMatchObject({
        proxyId: PlanProduct._id,
        code: 'ProductWrongTypeError',
        received: PlanProduct.type,
        required: 'CONFIGURABLE_PRODUCT',
      });
    });

    it('return not found error when passed non existing product ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation AddProductAssignment(
            $proxyId: ID!
            $productId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
            addProductAssignment(
              proxyId: $proxyId
              productId: $productId
              vectors: $vectors
            ) {
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

      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'ProductNotFoundError',
      });
    });

    it('return not found error when passed non existing proxy ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation AddProductAssignment(
            $proxyId: ID!
            $productId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
            addProductAssignment(
              proxyId: $proxyId
              productId: $productId
              vectors: $vectors
            ) {
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
      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'ProductNotFoundError',
      });
    });

    it('return error when passed invalid product ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation AddProductAssignment(
            $proxyId: ID!
            $productId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
            addProductAssignment(
              proxyId: $proxyId
              productId: $productId
              vectors: $vectors
            ) {
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

      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'InvalidIdError',
      });
    });

    it('return error when passed invalid proxy ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation AddProductAssignment(
            $proxyId: ID!
            $productId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
            addProductAssignment(
              proxyId: $proxyId
              productId: $productId
              vectors: $vectors
            ) {
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
      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'InvalidIdError',
      });
    });
  });

  describe('mutation.addProductAssignment for logged in user should', () => {
    it('return error', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation AddProductAssignment(
            $proxyId: ID!
            $productId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
            addProductAssignment(
              proxyId: $proxyId
              productId: $productId
              vectors: $vectors
            ) {
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

      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'NoPermissionError',
      });
    });
  });

  describe('mutation.addProductAssignment for anonymous user should', () => {
    it('return error', async () => {
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation AddProductAssignment(
            $proxyId: ID!
            $productId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
            addProductAssignment(
              proxyId: $proxyId
              productId: $productId
              vectors: $vectors
            ) {
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

      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'NoPermissionError',
      });
    });
  });

  describe('mutation.removeProductAssignment for admin user should', () => {
    it('Update proxy to a product when passed valid proxy  ID of CONFIGURABLE_PRODUCT type', async () => {
      const { data: { removeProductAssignment } = {} } =
        await graphqlFetchAsAdmin({
          query: /* GraphQL */ `
            mutation RemoveProductAssignment(
              $proxyId: ID!
              $vectors: [ProductAssignmentVectorInput!]!
            ) {
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
      expect(removeProductAssignment._id).toBe(ConfigurableProduct._id);
    });

    it('return error when passed non CONFIGURABLE_PRODUCT type id', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation RemoveProductAssignment(
            $proxyId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
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

      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'ProductWrongTypeError',
        received: SimpleProduct.type,
        required: 'CONFIGURABLE_PRODUCT',
      });
    });

    it('return not found error when passed non existing proxy  ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation RemoveProductAssignment(
            $proxyId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
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

      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'ProductNotFoundError',
      });
    });

    it('return error when passed invalid valid proxy  ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation RemoveProductAssignment(
            $proxyId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
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
      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'InvalidIdError',
      });
    });
  });

  describe('mutation.removeProductAssignment for normal user should', () => {
    it('return error', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation RemoveProductAssignment(
            $proxyId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
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

      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'NoPermissionError',
      });
    });
  });

  describe('mutation.removeProductAssignment for anonymous user should', () => {
    it('return error', async () => {
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation RemoveProductAssignment(
            $proxyId: ID!
            $vectors: [ProductAssignmentVectorInput!]!
          ) {
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

      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'NoPermissionError',
      });
    });
  });
});
