import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';

let connection;
let db;
let graphqlFetch;

describe('cart checkout', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.createCart', () => {
    it('create a cart with a specific order number', async () => {
      const { data: { createCart } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            createCart(orderNumber: "wishlist") {
              _id
              orderNumber
            }
          }
        `
      });
      expect(createCart).toMatchObject({
        orderNumber: 'wishlist'
      });
    });
  });
});
