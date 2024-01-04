import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { PlanProduct, SimpleProduct } from './seeds/products.js';

let graphqlFetch;
let db;

describe('ProductsSupply', () => {
  beforeAll(async () => {
    [db] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('mutation.updateProductSupply should for admin user', () => {
    it('Update product supply successfuly when passed SIMPLE_PRODUCT type', async () => {
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
      const updatedProduct = await (db.collection('products')).findOne({ _id: SimpleProduct._id });
      expect(updatedProduct.supply).toEqual({
        weightInGram: 100,
        heightInMillimeters: 200,
        lengthInMillimeters: 300,
        widthInMillimeters: 400,
      });
    });

    it('return error when passed non SIMPLE_PRODUCT type', async () => {
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
          productId: PlanProduct._id,
          supply: {
            weightInGram: 100,
            heightInMillimeters: 200,
            lengthInMillimeters: 300,
            widthInMillimeters: 400,
          },
        },
      });

      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'ProductWrongTypeError',
        received: 'PLAN_PRODUCT',
        required: 'SIMPLE_PRODUCT',
      });
    });

    it('return not found error when passed non existing productId', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error when passed invalid productId', async () => {
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
          productId: '',
          supply: {
            weightInGram: 100,
            heightInMillimeters: 200,
            lengthInMillimeters: 300,
            widthInMillimeters: 400,
          },
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
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

      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });
});
