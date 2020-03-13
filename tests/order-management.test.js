import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { SimpleOrder, ConfirmedOrder } from './seeds/orders';

let connection;
// eslint-disable-next-line no-unused-vars
let db;
let graphqlFetch;

describe('Order Management', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.removeOrder', () => {
    it('cannot remove an already submitted order', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeOrder($orderId: ID!) {
            removeOrder(orderId: $orderId) {
              _id
              status
            }
          }
        `,
        variables: {
          orderId: ConfirmedOrder._id
        }
      });
      expect(errors.length).toEqual(1);
    });

    it('remove a cart', async () => {
      const { data: { removeOrder } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeOrder($orderId: ID!) {
            removeOrder(orderId: $orderId) {
              _id
              status
            }
          }
        `,
        variables: {
          orderId: SimpleOrder._id
        }
      });
      expect(removeOrder).toMatchObject({
        _id: SimpleOrder._id
      });
    });
  });
});
