import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { SimpleProduct } from './seeds/products';

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

  describe('Mutation.addCartDiscount', () => {
    it('add order discount to the cart', async () => {
      const { data: { addCartDiscount } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addCartDiscount {
            addCartDiscount(code: "100off") {
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
                discounts {
                  _id
                  code
                }
              }
            }
          }
        `
      });
      console.log(addCartDiscount);
      expect(addCartDiscount).toMatchObject({
        code: '100OFF',
        discounted: [],
        order: {
          discounts: [
            {
              code: '100OFF'
            }
          ]
        }
      });
    });

    it('add product discount to the cart', async () => {
      const { data: { addCartDiscount } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addCartDiscount {
            addCartDiscount(code: "HALFPRICE") {
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
                discounts {
                  _id
                  code
                }
              }
            }
          }
        `
      });
      expect(addCartDiscount).toMatchObject({
        code: 'HALFPRICE',
        discounted: [],
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
