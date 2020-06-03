import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users';
import { SimpleProduct } from './seeds/products';

let connection;
let graphqlFetch;

describe('ProductsSupply', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('mutation.updateProductSupply should for admin user', () => {
    it('Update product supply successfuly', async () => {
      const { data: { updateProductSupply } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductSupply(
            $productId: ID!
            $supply: UpdateProductSupplyInput!
          ) {
            updateProductSupply(productId: $productId, supply: $supply) {
              _id
              sequence
              status
              tags
              updated
              created
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
                  assortmentId
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
          supply: {
            weightInGram: 100,
            heightInMillimeters: 200,
            lengthInMillimeters: 300,
            widthInMillimeters: 400,
          },
        },
      });

      expect(updateProductSupply._id).toEqual(SimpleProduct._id);
    });

    it('return error when attempting to update non existing product', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductSupply(
            $productId: ID!
            $supply: UpdateProductSupplyInput!
          ) {
            updateProductSupply(productId: $productId, supply: $supply) {
              _id
            }
          }
        `,
        variables: {
          productId: 'none-existing-id',
          supply: {
            weightInGram: 100,
            heightInMillimeters: 200,
            lengthInMillimeters: 300,
            widthInMillimeters: 400,
          },
        },
      });

      expect(errors.length).toEqual(1);
    });
  });

  describe('mutation.updateProductSupply for anonymous user', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateProductSupply(
            $productId: ID!
            $supply: UpdateProductSupplyInput!
          ) {
            updateProductSupply(productId: $productId, supply: $supply) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          supply: {
            weightInGram: 100,
            heightInMillimeters: 200,
            lengthInMillimeters: 300,
            widthInMillimeters: 400,
          },
        },
      });

      expect(errors.length).toEqual(1);
    });
  });
});
