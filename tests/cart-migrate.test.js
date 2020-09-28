import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { SimpleProduct } from './seeds/products';

let connection;
let db;
let anonymousGraphqlFetch;
let graphqlFetch;
let guestToken;

describe('Guest user cart migration', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase({ skipOrders: true }); // just to avoid confusion caused by other orders
    anonymousGraphqlFetch = await createAnonymousGraphqlFetch();
    graphqlFetch = await createLoggedInGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  it('login as guest', async () => {
    const result = await anonymousGraphqlFetch({
      query: /* GraphQL */ `
        mutation {
          loginAsGuest {
            id
            token
          }
        }
      `,
    });
    guestToken = result.data.loginAsGuest.token;
    expect(result.data.loginAsGuest).toMatchObject({});
  });

  it('add a product to the cart', async () => {
    const loggedInGraphqlFetch = await createLoggedInGraphqlFetch(
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
    const { data: { loginWithPassword } = {} } = await graphqlFetch({
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
    // Although the admin has placed no orders you can find
    const Orders = db.collection('orders');
    expect(
      await Orders.findOne({ userId: loginWithPassword.id }),
    ).toMatchObject({});
  });
});
