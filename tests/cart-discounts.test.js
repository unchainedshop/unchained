import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { SimpleOrder, DiscountedDiscount } from './seeds/orders';
import { USER_TOKEN } from './seeds/users';

let connection;
let db; // eslint-disable-line
let graphqlFetch;

describe('cart checkout', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(USER_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.addCartDiscount', () => {
    it('add product discount to the cart', async () => {
      const { data: { addCartDiscount } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addCartDiscount($orderId: ID) {
            addCartDiscount(orderId: $orderId, code: "HALFPRICE") {
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
      expect(addCartDiscount.order.total.amount).toBe(0);
      expect(addCartDiscount).toMatchObject({
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
    it('add order discount to the cart', async () => {
      const { data: { addCartDiscount } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addCartDiscount($orderId: ID) {
            addCartDiscount(orderId: $orderId, code: "100off") {
              code
              discounted {
                _id
                ... on OrderGlobalDiscount {
                  _id
                  order {
                    _id
                  }
                  orderDiscount {
                    _id
                    code
                    trigger
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

      expect(addCartDiscount.order.total.amount).toBeLessThan(0);
      expect(addCartDiscount).toMatchObject({
        code: '100OFF',
        discounted: [
          {
            order: {},
            orderDiscount: {},
            total: {}
          }
        ],
        order: {
          discounts: [
            {},
            {
              code: '100OFF'
            }
          ]
        }
      });
    });

    it('remove order discount from a cart', async () => {
      const { data: { removeCartDiscount } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeCartDiscount($discountId: ID!) {
            removeCartDiscount(discountId: $discountId) {
              code
              _id
              order {
                total(category: DISCOUNTS) {
                  amount
                }
              }
            }
          }
        `,
        variables: {
          discountId: DiscountedDiscount._id
        }
      });

      expect(removeCartDiscount.order.total.amount).toBe(0);
      expect(removeCartDiscount).toMatchObject({
        code: '100OFF',
        order: {
          total: {}
        }
      });
    });
  });
});
