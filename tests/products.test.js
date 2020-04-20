import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { ADMIN_TOKEN } from './seeds/users';

let connection;
let db; // eslint-disable-line
let graphqlFetch;

describe('Products', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.createProduct', () => {
    it('create a new product', async () => {
      const { data: { createProduct } = {} } = await graphqlFetch({
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
});
