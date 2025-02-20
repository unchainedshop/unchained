import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { SimpleOrder, DiscountedDiscount } from './seeds/orders.js';
import { USER_TOKEN, ADMIN_TOKEN } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';

test.describe('Cart: Discounts', () => {
  let graphqlFetch;
  let adminGraphqlFetch;

  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);
    adminGraphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.addCartDiscount', () => {
    test('add product discount to the cart', async () => {
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
          orderId: SimpleOrder._id,
        },
      });
      assert.strictEqual(addCartDiscount.order.total.amount, 0);

      assert.partialDeepStrictEqual(addCartDiscount, {
        code: 'HALFPRICE',
      });
      assert.partialDeepStrictEqual(addCartDiscount.discounted[0], {
        item: {},
        total: {},
      });
      assert.partialDeepStrictEqual(addCartDiscount.order.discounts[0], {
        code: 'HALFPRICE',
      });
    });
    test('add order discount to the cart', async () => {
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
          orderId: SimpleOrder._id,
        },
      });

      assert(addCartDiscount.order.total.amount < 0);
      assert.partialDeepStrictEqual(addCartDiscount, {
        code: '100off',
      });
      assert.partialDeepStrictEqual(addCartDiscount.discounted[0], {
        order: {},
        orderDiscount: {},
        total: {},
      });
      assert.partialDeepStrictEqual(addCartDiscount.order.discounts.pop(), {
        code: '100off',
      });
    });

    test('return not found error when non existing orderId is provided', async () => {
      const { errors } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation addCartDiscount($orderId: ID) {
            addCartDiscount(orderId: $orderId, code: "100oft") {
              code
            }
          }
        `,
        variables: {
          orderId: 'non-existing-id',
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'OrderNotFoundError');
    });
  });

  test.describe('Mutation.removeCartDiscount', () => {
    test('remove order discount from a cart', async () => {
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
          discountId: DiscountedDiscount._id,
        },
      });

      assert.strictEqual(removeCartDiscount.order.total.amount, 0);
      assert.partialDeepStrictEqual(removeCartDiscount, {
        code: '100OFF',
        order: {
          total: {},
        },
      });
    });

    test('return not found error when passed non existing discountId', async () => {
      const { errors } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation removeCartDiscount($discountId: ID!) {
            removeCartDiscount(discountId: $discountId) {
              _id
            }
          }
        `,
        variables: {
          discountId: 'non-existing-id',
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'OrderDiscountNotFoundError');
    });

    test('return error when passed invalid discountId', async () => {
      const { errors } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation removeCartDiscount($discountId: ID!) {
            removeCartDiscount(discountId: $discountId) {
              _id
            }
          }
        `,
        variables: {
          discountId: '',
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });
});
