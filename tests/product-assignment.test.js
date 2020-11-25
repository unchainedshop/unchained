import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users';
import {
  SimpleProduct,
  ConfigurableProduct,
  PlanProduct,
} from './seeds/products';

let connection;
let graphqlFetch;

describe('ProductAssignment', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('mutation.addProductAssignment for admin user should', () => {
    it('assign proxy to a product when passed valid proxy, product ID and CONFIGURABLE_PRODUCT type', async () => {
      const { data: { addProductAssignment } = {} } = await graphqlFetch({
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
              meta
              assortmentPaths {
                links {
                  link {
                    _id
                    parent {
                      _id
                    }
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
          productId: ConfigurableProduct._id,
          proxyId: SimpleProduct._id,
          vectors: [
            { key: 'key-1', value: 'value-1' },
            { key: 'key-2', value: 'value-2' },
            { key: 'key-3', value: 'value-3' },
          ],
        },
      });
      expect(addProductAssignment.assortmentPaths.length).not.toBe(0);
    });

    it('return error when passed non CONFIGURABLE_PRODUCT type', async () => {
      const { errors } = await graphqlFetch({
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
          productId: PlanProduct._id,
          proxyId: SimpleProduct._id,
          vectors: [
            { key: 'key-1', value: 'value-1' },
            { key: 'key-2', value: 'value-2' },
            { key: 'key-3', value: 'value-3' },
          ],
        },
      });
      expect(errors?.[0]?.extensions).toMatchObject({
        productId: PlanProduct._id,
        code: 'ProductWrongStatusError',
        recieved: PlanProduct.type,
        required: 'CONFIGURABLE_PRODUCT',
      });
    });

    it('return not found error when passed non existing product ID', async () => {
      const { errors } = await graphqlFetch({
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

      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return not found error when passed non existing proxy ID', async () => {
      const { errors } = await graphqlFetch({
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

      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error when passed invalid product ID', async () => {
      const { errors } = await graphqlFetch({
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

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });

    it('return error when passed invalid proxy ID', async () => {
      const { errors } = await graphqlFetch({
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

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.addProductAssignment for anonymous user should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();

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

      expect(errors.length).toEqual(1);
    });
  });

  describe('mutation.removeProductAssignment for admin user should', () => {
    it('Updaye proxy to a product when passed valid proxy  ID', async () => {
      const { data: { removeProductAssignment } = {} } = await graphqlFetch({
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
              meta
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

      expect(removeProductAssignment._id).not.toBe(null);
    });

    it('return not found error when passed non existing proxy  ID', async () => {
      const { errors } = await graphqlFetch({
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

      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error when passed invalid valid proxy  ID', async () => {
      const { errors } = await graphqlFetch({
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

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.removeProductAssignment for anonymous user should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();

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

      expect(errors.length).toEqual(1);
    });
  });
});
