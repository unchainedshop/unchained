import fetch from "isomorphic-unfetch";
import { createLoggedInGraphqlFetch, setupDatabase } from "./helpers";
import { USER_TOKEN } from "./seeds/users";
import { SimplePaymentProvider } from "./seeds/payments";
import { SimpleOrder, SimplePosition, SimplePayment } from "./seeds/orders";
import { SimpleProduct, PlanProduct } from "./seeds/products";
import { BTC_DERIVATIONS, ETH_DERIVATIONS } from "./seeds/cryptopay";

import { AllEnrollmentIds } from "./seeds/enrollments";

let db;
let graphqlFetch;

describe("Plugins: Cryptopay Payments", () => {
  beforeAll(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);

    await db.collection("products").findOrInsertOne({
      ...SimpleProduct,
      _id: "single-item-product-id",
    });

    await db.collection("payment-providers").findOrInsertOne({
      ...SimplePaymentProvider,
      _id: "cryptopay-payment-provider",
      adapterKey: "shop.unchained.payment.cryptopay",
      type: "GENERIC",
    });

    // Add a demo order ready to checkout
    await db.collection("order_payments").findOrInsertOne({
      ...SimplePayment,
      _id: "cryptopay-payment",
      paymentProviderId: "cryptopay-payment-provider",
      orderId: "cryptopay-order",
    });

    await db.collection("order_positions").findOrInsertOne({
      ...SimplePosition,
      _id: "cryptopay-order-position",
      orderId: "cryptopay-order",
      quantity: 1,
      productId: "single-item-product-id",
    });

    await db.collection("orders").findOrInsertOne({
      ...SimpleOrder,
      _id: "cryptopay-order",
      orderNumber: "cryptopay",
      paymentId: "cryptopay-payment",
    });

    // Add a second demo order ready to checkout
    await db.collection("order_payments").findOrInsertOne({
      ...SimplePayment,
      _id: "cryptopay-payment2",
      paymentProviderId: "cryptopay-payment-provider",
      orderId: "cryptopay-order2",
    });

    await db.collection("order_positions").findOrInsertOne({
      ...SimplePosition,
      _id: "cryptopay-order-position2",
      orderId: "cryptopay-order2",
      quantity: 1,
      productId: "single-item-product-id",
    });

    await db.collection("orders").findOrInsertOne({
      ...SimpleOrder,
      _id: "cryptopay-order2",
      orderNumber: "cryptopay2",
      paymentId: "cryptopay-payment2",
    });
  });

  describe("Mutation.sign (Cryptopay)", () => {
    it("Derive address for first order", async () => {
      const { data } = await graphqlFetch({
        query: /* GraphQL */ `
            mutation signPaymentProviderForCheckout(
              $orderPaymentId: ID!
            ) {
              signPaymentProviderForCheckout(
                orderPaymentId: $orderPaymentId
              )
            }
          `,
        variables: {
          orderPaymentId: "cryptopay-payment",
        },
      });
      expect(JSON.parse(data?.signPaymentProviderForCheckout)).toMatchObject([
        { currency: 'BTC', address: BTC_DERIVATIONS[0] },
        { currency: 'ETH', address: ETH_DERIVATIONS[0] }
      ]);
    }, 10000);

    it("Derive address for second order", async () => {
      const { data } = await graphqlFetch({
        query: /* GraphQL */ `
            mutation signPaymentProviderForCheckout(
              $orderPaymentId: ID!
            ) {
              signPaymentProviderForCheckout(
                orderPaymentId: $orderPaymentId
              )
            }
          `,
        variables: {
          orderPaymentId: "cryptopay-payment2",
        },
      });
      expect(JSON.parse(data?.signPaymentProviderForCheckout)).toMatchObject([
        { currency: 'BTC', address: BTC_DERIVATIONS[1] },
        { currency: 'ETH', address: ETH_DERIVATIONS[1] }
      ]);
    }, 10000);

    it("Immutable derivations: Address for order payments should not change", async () => {
      const { data } = await graphqlFetch({
        query: /* GraphQL */ `
            mutation signPaymentProviderForCheckout(
              $orderPaymentId: ID!
            ) {
              signPaymentProviderForCheckout(
                orderPaymentId: $orderPaymentId
              )
            }
          `,
        variables: {
          orderPaymentId: "cryptopay-payment",
        },
      });
      expect(JSON.parse(data?.signPaymentProviderForCheckout)).toMatchObject([
        { currency: 'BTC', address: BTC_DERIVATIONS[0] },
        { currency: 'ETH', address: ETH_DERIVATIONS[0] }
      ]);
    }, 10000);
  });
});
