import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users';
import {
  SimpleProduct,
  SimpleProductBundle,
  ConfigurableProduct,
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
    it('assign proxy to a product when passed valid proxy and product ID', async () => {
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
          proxyId: ConfigurableProduct._id,
          vectors: [
            { key: 'key-1', value: 'value-1' },
            { key: 'key-2', value: 'value-2' },
            { key: 'key-3', value: 'value-3' },
          ],
        },
      });

      expect(addProductAssignment._id).not.toBe(null);
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
          productId: 'invalid-product-id',
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
          proxyId: 'invalid-proxy-id',
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

  describe('mutation.addProductAssignment for admin user should', () => {
    it('assign proxy to a product when passed valid proxy and product ID', async () => {
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
});
