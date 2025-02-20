import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { SimpleProduct } from './seeds/products.js';
import { GUEST_TOKEN } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';

test.describe('Guest user cart migration', () => {
  let db;
  let anonymousGraphqlFetch;
  let loggedInGraphqlFetch;
  let orderId;

  test.before(async () => {
    [db] = await setupDatabase();
    anonymousGraphqlFetch = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test('login as guest', async () => {
    const result = await anonymousGraphqlFetch({
      query: /* GraphQL */ `
        mutation {
          loginAsGuest {
            _id
          }
        }
      `,
    });
    assert.deepStrictEqual(result.data.loginAsGuest, {});
  });

  test('add a product to the cart', async () => {
    loggedInGraphqlFetch = createLoggedInGraphqlFetch(GUEST_TOKEN);
    const result = await loggedInGraphqlFetch({
      query: /* GraphQL */ `
        mutation addCartProduct(
          $productId: ID!
          $quantity: Int
          $configuration: [ProductConfigurationParameterInput!]
        ) {
          addCartProduct(productId: $productId, quantity: $quantity, configuration: $configuration) {
            _id
            quantity
            total {
              currency
              amount
            }
            taxes: total(category: TAX) {
              currency
              amount
            }
            product {
              _id
            }
            order {
              _id
            }
            configuration {
              key
              value
            }
          }
        }
      `,
      variables: {
        productId: SimpleProduct._id,
        quantity: 2,
        configuration: [{ key: 'length', value: '5' }],
      },
    });
    orderId = result.data.addCartProduct.order._id;
    assert.deepStrictEqual(result.data.addCartProduct, {
      quantity: 2,
      total: {
        currency: 'CHF',
        amount: 20000,
      },
      taxes: {
        amount: 1499,
      },
      product: {
        _id: SimpleProduct._id,
      },
      order: {},
      configuration: [
        {
          key: 'length',
        },
      ],
    });
  });

  test('check if cart contains product after normal login', async () => {
    const { data: { loginWithPassword } = {} } = await loggedInGraphqlFetch({
      query: /* GraphQL */ `
        mutation {
          loginWithPassword(username: "admin", password: "password") {
            _id
            user {
              _id
              username
            }
          }
        }
      `,
    });
    const adminOrder = await db.collection('orders').findOne({
      userId: loginWithPassword.user._id,
      _id: orderId,
    });
    assert.deepStrictEqual(adminOrder, {});
  });
});
