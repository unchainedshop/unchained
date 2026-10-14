import { sha256 } from '@unchainedshop/utils';
import { setupDatabase, createLoggedInGraphqlFetch, disconnect, tokenCookieOf } from './helpers.js';
import { getTestPlatform } from './setup.js';
import { SimpleProduct } from './seeds/products.js';
import { GUEST_TOKEN, User } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';

test.describe('Guest user cart migration', () => {
  let db;
  let loggedInGraphqlFetch;
  let orderId;

  test.before(async () => {
    [db] = await setupDatabase();
  });

  test.after(async () => {
    await disconnect();
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
              currencyCode
              amount
            }
            taxes: total(category: TAX) {
              currencyCode
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
    assert.partialDeepStrictEqual(result.data.addCartProduct, {
      quantity: 2,
      total: {
        currencyCode: 'CHF',
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
          value: '5',
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
    assert.ok(adminOrder);
  });

  for (const mutation of ['loginWithPassword', 'verifyEmail']) {
    test(`${mutation} skips the merge into a locked cart`, async () => {
      const { modules } = getTestPlatform().unchainedAPI;
      const userId = `locked-cart-${mutation}`;
      const address = `${userId}@unchained.local`;
      const token = `${userId}-token`;
      await db.collection('users').insertOne({
        ...User,
        _id: userId,
        username: userId,
        emails: [{ address, verified: false }],
        services: {
          password: User.services.password,
          email: { verificationTokens: [{ token: await sha256(token), address, when: new Date() }] },
        },
      });
      await db
        .collection('users')
        .updateOne({ _id: 'guest' }, { $set: { lastLogin: { countryCode: 'CH' } } });
      await modules.orders.create({ userId: 'guest', currencyCode: 'CHF', countryCode: 'CH' });
      const userCart = await modules.orders.create({ userId, currencyCode: 'CHF', countryCode: 'CH' });

      const lock = await modules.orders.acquireLock(userCart._id, 'checkout');
      let response;
      try {
        response = await createLoggedInGraphqlFetch(GUEST_TOKEN)({
          query:
            mutation === 'verifyEmail'
              ? 'mutation verifyEmail($token: String!) { verifyEmail(token: $token) { _id } }'
              : 'mutation loginWithPassword($username: String!) { loginWithPassword(username: $username, password: "password") { _id } }',
          variables: mutation === 'verifyEmail' ? { token } : { username: userId },
        });
      } finally {
        await lock.release();
      }

      assert.strictEqual(response.errors, undefined);
      assert.ok(tokenCookieOf(response.headers));
      const userCarts = await db.collection('orders').find({ userId, status: null }).toArray();
      assert.deepStrictEqual(
        userCarts.map(({ _id }) => _id),
        [userCart._id],
      );
    });
  }
});
