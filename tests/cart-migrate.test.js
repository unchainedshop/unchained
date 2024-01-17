import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from "./helpers.js";
import { SimpleProduct } from "./seeds/products.js";

let db;
let anonymousGraphqlFetch;
let guestToken;
let loggedInGraphqlFetch;
let orderId;

describe("Guest user cart migration", () => {
  beforeAll(async () => {
    [db] = await setupDatabase();
    anonymousGraphqlFetch = await createAnonymousGraphqlFetch();
  });

  it("login as guest", async () => {
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

  it("add a product to the cart", async () => {
    loggedInGraphqlFetch = await createLoggedInGraphqlFetch(`Bearer ${guestToken}`);
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
              _id
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
        configuration: [{ key: "length", value: "5" }],
      },
    });
    orderId = result.data.addCartProduct.order._id;
    expect(result.data.addCartProduct).toMatchObject({
      quantity: 2,
      total: {
        currency: "CHF",
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
          key: "length",
        },
      ],
    });
  });

  it("check if cart contains product after normal login", async () => {
    const { data: { loginWithPassword } = {} } = await loggedInGraphqlFetch({
      query: /* GraphQL */ `
        mutation {
          loginWithPassword(username: "admin", password: "password") {
            id
            token
            user {
              username
            }
          }
        }
      `,
    });
    const adminOrder = await db.collection("orders").findOne({
      userId: loginWithPassword.id,
      _id: orderId,
    });
    expect(adminOrder).toMatchObject({});
  });
});
