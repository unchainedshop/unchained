import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { SimpleOrder, DiscountedDiscount } from './seeds/orders';
import { USER_TOKEN } from './seeds/users';

let connection;
let db;
let graphqlFetch;

describe('cart checkout', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(USER_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.addCartQuotation', () => {
    it('add quotation to the cart', async () => {
      const { data: { addCartQuotation } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addCartQuotation($orderId: ID) {
            addCartQuotation(orderId: $orderId, code: "HALFPRICE") {
              code
              discounted {
                _id
                ... on OrderItemDiscount {
                  item {
                    _id
                  }
                }
                total {
                  amount
                }
              }
              _id
              order {
                total(category: DISCOUNTS) {
                  amount
                }
                discounts {
                  _id
                  code
                }
              }
            }
          }
        `,
        variables: {
          orderId: SimpleOrder._id
        }
      });
      expect(addCartQuotation.order.total.amount).toBe(0);
      expect(addCartQuotation).toMatchObject({
        code: 'HALFPRICE',
        discounted: [
          {
            item: {},
            total: {}
          }
        ],
        order: {
          discounts: [
            {
              code: 'HALFPRICE'
            }
          ]
        }
      });
    });
  });
});
