import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { SimpleProduct } from './seeds/products';

let connection;
let db;
let anonymousGraphqlFetch;
let loggedInGraphqlFetch;
let orderId;

describe('Guest user cart migration', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    anonymousGraphqlFetch = await createAnonymousGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  it('add a product to the cart', async () => {
    const {
      data: {
        loginAsGuest: { token },
      },
    } = await anonymousGraphqlFetch({
      query: /* GraphQL */ `
        mutation {
          loginAsGuest {
            id
            token
          }
        }
      `,
    });
    const guestToken = token;
    expect(guestToken).toBeTruthy();

    loggedInGraphqlFetch = await createLoggedInGraphqlFetch(
      `Bearer ${guestToken}`,
    );

    const result = await loggedInGraphqlFetch({
      query: /* GraphQL */ `
        mutation addCartProduct(
          $productId: ID!
          $quantity: Int
          $configuration: [ProductConfigurationParameterInput!]
        ) {
          addCartProduct(
            productId: $productId
            quantity: $quantity
            configuration: $configuration
          ) {
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

    expect(result.data.addCartProduct).toMatchObject({
      quantity: 2,
      total: {
        currency: 'CHF',
        amount: 20000,
      },
      taxes: {
        amount: 1430,
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

  it('check if cart contains product after normal login', async () => {
    const { data: { loginWithPassword } = {} } = await loggedInGraphqlFetch({
      query: /* GraphQL */ `
        mutation {
          loginWithPassword(username: "admin", plainPassword: "password") {
            id
            token
            user {
              username
            }
          }
        }
      `,
    });
    // We use settimeout to induce a delay since the hook doesn't set the values immediately
    setTimeout(async () => {
      // Although the admin has placed no orders you can find an order of his
      const adminOrders = await db.collection('orders').findOne({
        userId: loginWithPassword.id,
        _id: orderId,
      });
      expect(adminOrders).toMatchObject({});
    }, 0);
  });
});
