import fetch from "isomorphic-unfetch";
import { createLoggedInGraphqlFetch, setupDatabase } from "./helpers";
import { USER_TOKEN } from "./seeds/users";
import { SimplePaymentProvider } from "./seeds/payments";
import { SimpleOrder, SimplePosition, SimplePayment } from "./seeds/orders";
import { SimpleProduct, PlanProduct } from "./seeds/products";
import { CRYPTOPAY_SECRET, BTC_XPUB, BTC_TESTNET, ETH_XPUB } from "./seeds/cryptopay";

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
        { currency: 'BTC', address: 'mi8xYhSSkFpdcQ14RM1v9Qs54iF9T51iqK' },
        {
          currency: 'ETH',
          address: '0xaC39b311DCEb2A4b2f5d8461c1cdaF756F4F7Ae9'
        }
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
        { currency: 'BTC', address: 'mkJv2TAA6LkW71id8Px9Un2Mwi77CE2jvs' },
        {
          currency: 'ETH',
          address: '0xD7c0Cd9e7d2701c710D64Fc492C7086679BdF7b4'
        }
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
      console.log(data?.signPaymentProviderForCheckout);
      expect(JSON.parse(data?.signPaymentProviderForCheckout)).toMatchObject([
        { currency: 'BTC', address: 'mi8xYhSSkFpdcQ14RM1v9Qs54iF9T51iqK' },
        {
          currency: 'ETH',
          address: '0xaC39b311DCEb2A4b2f5d8461c1cdaF756F4F7Ae9'
        }
      ]);
    }, 10000);

    //   it("return not found error when passed non existing paymentProviderId", async () => {
    //     const { errors } = await graphqlFetch({
    //       query: /* GraphQL */ `
    //           mutation registerPaymentCredentials(
    //             $transactionContext: JSON!
    //             $paymentProviderId: ID!
    //           ) {
    //             registerPaymentCredentials(
    //               transactionContext: $transactionContext
    //               paymentProviderId: $paymentProviderId
    //             ) {
    //               _id
    //             }
    //           }
    //         `,
    //       variables: {
    //         transactionContext: {
    //           receiptData,
    //         },
    //         paymentProviderId: "non-existing",
    //       },
    //     });
    //     expect(errors[0]?.extensions?.code).toEqual(
    //       "PaymentProviderNotFoundError"
    //     );
    //   });

    //   it("return error when passed invalid paymentProviderId", async () => {
    //     const { errors } = await graphqlFetch({
    //       query: /* GraphQL */ `
    //           mutation registerPaymentCredentials(
    //             $transactionContext: JSON!
    //             $paymentProviderId: ID!
    //           ) {
    //             registerPaymentCredentials(
    //               transactionContext: $transactionContext
    //               paymentProviderId: $paymentProviderId
    //             ) {
    //               _id
    //             }
    //           }
    //         `,
    //       variables: {
    //         transactionContext: {
    //           receiptData,
    //         },
    //         paymentProviderId: "",
    //       },
    //     });
    //     expect(errors[0]?.extensions?.code).toEqual("InvalidIdError");
    //   });
    //   it("checkout with stored receipt in credentials", async () => {
    //     const { data: { updateOrderPaymentGeneric, checkoutCart } = {} } =
    //       await graphqlFetch({
    //         query: /* GraphQL */ `
    //             mutation checkout(
    //               $orderId: ID!
    //               $orderPaymentId: ID!
    //               $meta: JSON
    //             ) {
    //               updateOrderPaymentGeneric(
    //                 orderPaymentId: $orderPaymentId
    //                 meta: $meta
    //               ) {
    //                 _id
    //                 status
    //               }
    //               checkoutCart(orderId: $orderId) {
    //                 _id
    //                 status
    //               }
    //             }
    //           `,
    //         variables: {
    //           orderPaymentId: "iap-payment",
    //           orderId: "iap-order",
    //           meta: {
    //             transactionIdentifier: singleItemTransactionIdentifier,
    //           },
    //         },
    //       });
    //     expect(updateOrderPaymentGeneric).toMatchObject({
    //       status: "OPEN",
    //     });
    //     expect(checkoutCart).toMatchObject({
    //       status: "CONFIRMED",
    //     });
    //   }, 10000);

    //   it("checking out again with the same transaction should fail", async () => {
    //     const { errors, data } = await graphqlFetch({
    //       query: /* GraphQL */ `
    //           mutation checkout(
    //             $paymentContext: JSON
    //             $paymentProviderId: ID!
    //             $productId: ID!
    //           ) {
    //             emptyCart {
    //               _id
    //             }
    //             addCartProduct(productId: $productId) {
    //               _id
    //             }
    //             updateCart(paymentProviderId: $paymentProviderId) {
    //               _id
    //             }
    //             checkoutCart(paymentContext: $paymentContext) {
    //               _id
    //               status
    //             }
    //           }
    //         `,
    //       variables: {
    //         paymentProviderId: "iap-payment-provider",
    //         productId: singleItemProductId,
    //         paymentContext: {
    //           receiptData,
    //           meta: {
    //             transactionIdentifier: singleItemTransactionIdentifier,
    //           },
    //         },
    //       },
    //     });

    //     expect(errors?.[0].extensions.code).toEqual("OrderCheckoutError");
    //   }, 10000);
    // });

    // describe("Apple Store Server Notifications", () => {
    //   it("notification_type = INITIAL_BUY", async () => {
    //     await graphqlFetch({
    //       query: /* GraphQL */ `
    //           mutation prepareCart(
    //             $paymentProviderId: ID!
    //             $orderId: ID
    //             $productId: ID!
    //             $orderPaymentId: ID!
    //             $meta: JSON
    //           ) {
    //             emptyCart(orderId: $orderId) {
    //               _id
    //             }
    //             addCartProduct(productId: $productId, orderId: $orderId) {
    //               _id
    //             }
    //             updateCart(
    //               orderId: $orderId
    //               paymentProviderId: $paymentProviderId
    //             ) {
    //               _id
    //             }
    //             updateOrderPaymentGeneric(
    //               orderPaymentId: $orderPaymentId
    //               meta: $meta
    //             ) {
    //               _id
    //               status
    //             }
    //           }
    //         `,
    //       variables: {
    //         paymentProviderId: "iap-payment-provider",
    //         orderPaymentId: "iap-payment2",
    //         orderId: "iap-order2",
    //         meta: {
    //           transactionIdentifier: subscriptionTransactionIdentifier,
    //         },
    //         productId: subscriptionProductId,
    //       },
    //     });

    //     const result = await fetch("http://localhost:3000/graphql/apple-iap", {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify(initialBuy),
    //     });
    //     expect(result.status).toBe(200);
    //     const order = await db
    //       .collection("orders")
    //       .findOne({ _id: "iap-order2" });
    //     expect(order.status).toBe("CONFIRMED");
    //   }, 10000);
    //   it("notification_type = DID_RECOVER should just store the current receipt", async () => {
    //     const result = await fetch("http://localhost:3000/graphql/apple-iap", {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify(didRecover),
    //     });
    //     expect(result.status).toBe(200);
    //     const enrollment = await db.collection("enrollments").findOne({
    //       _id: {
    //         $nin: AllEnrollmentIds,
    //       },
    //     });
    //     expect(enrollment?.status).toBe("ACTIVE");
    //   }, 10000);

    //   it("notification_type = DID_CHANGE_RENEWAL_STATUS should terminate enrollment", async () => {
    //     const result = await fetch("http://localhost:3000/graphql/apple-iap", {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify(didChangeRenewalStatus),
    //     });
    //     expect(result.status).toBe(200);
    //     const enrollment = await db.collection("enrollments").findOne({
    //       _id: {
    //         $nin: AllEnrollmentIds,
    //       },
    //     });
    //     expect(enrollment?.status).toBe("TERMINATED");
    //   }, 10000);
  });
});
