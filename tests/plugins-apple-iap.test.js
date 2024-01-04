import { createLoggedInGraphqlFetch, setupDatabase } from "./helpers.js";
import { USER_TOKEN } from "./seeds/users.js";
import { SimplePaymentProvider } from "./seeds/payments.js";
import { SimpleOrder, SimplePosition, SimplePayment } from "./seeds/orders.js";
import { SimpleProduct, PlanProduct } from "./seeds/products.js";

import {
  receiptData,
  singleItemProductId,
  singleItemTransactionIdentifier,
  subscriptionProductId,
  subscriptionTransactionIdentifier,
} from "./seeds/apple-iap-receipt.js";
import initialBuy from "./seeds/apple-iap-initial-buy.js";
import didRecover from "./seeds/apple-iap-did-recover.js";
import didChangeRenewalStatus from "./seeds/apple-iap-did-change-renewal-status.js";
import { AllEnrollmentIds } from "./seeds/enrollments.js";

let db;
let graphqlFetch;

  describe("Plugins: Apple IAP Payments", () => {
    beforeAll(async () => {
      [db] = await setupDatabase();
      graphqlFetch = await createLoggedInGraphqlFetch(USER_TOKEN);

      await db.collection("products").findOrInsertOne({
        ...SimpleProduct,
        _id: singleItemProductId,
      });

      await db.collection("products").findOrInsertOne({
        ...PlanProduct,
        _id: subscriptionProductId,
      });

      // Add a iap provider
      await db.collection("payment-providers").findOrInsertOne({
        ...SimplePaymentProvider,
        _id: "iap-payment-provider",
        adapterKey: "shop.unchained.apple-iap",
        type: "GENERIC",
      });

      // Add a demo order ready to checkout
      await db.collection("order_payments").findOrInsertOne({
        ...SimplePayment,
        _id: "iap-payment",
        paymentProviderId: "iap-payment-provider",
        orderId: "iap-order",
      });

      await db.collection("order_positions").findOrInsertOne({
        ...SimplePosition,
        _id: "iap-order-position",
        orderId: "iap-order",
        quantity: 1,
        productId: singleItemProductId,
      });

      await db.collection("orders").findOrInsertOne({
        ...SimpleOrder,
        _id: "iap-order",
        orderNumber: "iap",
        paymentId: "iap-payment",
      });

      // Add a second demo order ready to checkout
      await db.collection("order_payments").findOrInsertOne({
        ...SimplePayment,
        _id: "iap-payment2",
        paymentProviderId: "iap-payment-provider",
        orderId: "iap-order2",
      });

      await db.collection("order_positions").findOrInsertOne({
        ...SimplePosition,
        _id: "iap-order-position2",
        orderId: "iap-order2",
        quantity: 1,
        productId: subscriptionProductId,
      });

      await db.collection("orders").findOrInsertOne({
        ...SimpleOrder,
        _id: "iap-order2",
        orderNumber: "iap2",
        paymentId: "iap-payment2",
      });
    });

    describe("Mutation.registerPaymentCredentials (Apple IAP)", () => {
      it("store the receipt as payment credentials", async () => {
        const { data } = await graphqlFetch({
          query: /* GraphQL */ `
            mutation registerPaymentCredentials(
              $transactionContext: JSON!
              $paymentProviderId: ID!
            ) {
              registerPaymentCredentials(
                transactionContext: $transactionContext
                paymentProviderId: $paymentProviderId
              ) {
                _id
                isValid
                isPreferred
              }
            }
          `,
          variables: {
            transactionContext: {
              receiptData,
            },
            paymentProviderId: "iap-payment-provider",
          },
        });
        expect(data?.registerPaymentCredentials).toMatchObject({
          isValid: true,
          isPreferred: true,
        });
      }, 10000);

      it("return not found error when passed non existing paymentProviderId", async () => {
        const { errors } = await graphqlFetch({
          query: /* GraphQL */ `
            mutation registerPaymentCredentials(
              $transactionContext: JSON!
              $paymentProviderId: ID!
            ) {
              registerPaymentCredentials(
                transactionContext: $transactionContext
                paymentProviderId: $paymentProviderId
              ) {
                _id
              }
            }
          `,
          variables: {
            transactionContext: {
              receiptData,
            },
            paymentProviderId: "non-existing",
          },
        });
        expect(errors[0]?.extensions?.code).toEqual(
          "PaymentProviderNotFoundError"
        );
      });

      it("return error when passed invalid paymentProviderId", async () => {
        const { errors } = await graphqlFetch({
          query: /* GraphQL */ `
            mutation registerPaymentCredentials(
              $transactionContext: JSON!
              $paymentProviderId: ID!
            ) {
              registerPaymentCredentials(
                transactionContext: $transactionContext
                paymentProviderId: $paymentProviderId
              ) {
                _id
              }
            }
          `,
          variables: {
            transactionContext: {
              receiptData,
            },
            paymentProviderId: "",
          },
        });
        expect(errors[0]?.extensions?.code).toEqual("InvalidIdError");
      });
      it("checkout with stored receipt in credentials", async () => {
        const { data: { updateOrderPaymentGeneric, checkoutCart } = {} } =
          await graphqlFetch({
            query: /* GraphQL */ `
              mutation checkout(
                $orderId: ID!
                $orderPaymentId: ID!
                $meta: JSON
              ) {
                updateOrderPaymentGeneric(
                  orderPaymentId: $orderPaymentId
                  meta: $meta
                ) {
                  _id
                  status
                }
                checkoutCart(orderId: $orderId) {
                  _id
                  status
                }
              }
            `,
            variables: {
              orderPaymentId: "iap-payment",
              orderId: "iap-order",
              meta: {
                transactionIdentifier: singleItemTransactionIdentifier,
              },
            },
          });
        expect(updateOrderPaymentGeneric).toMatchObject({
          status: "OPEN",
        });
        expect(checkoutCart).toMatchObject({
          status: "CONFIRMED",
        });
      }, 10000);

      it("checking out again with the same transaction should fail", async () => {
        const { errors, data } = await graphqlFetch({
          query: /* GraphQL */ `
            mutation checkout(
              $paymentContext: JSON
              $paymentProviderId: ID!
              $productId: ID!
            ) {
              emptyCart {
                _id
              }
              addCartProduct(productId: $productId) {
                _id
              }
              updateCart(paymentProviderId: $paymentProviderId) {
                _id
              }
              checkoutCart(paymentContext: $paymentContext) {
                _id
                status
              }
            }
          `,
          variables: {
            paymentProviderId: "iap-payment-provider",
            productId: singleItemProductId,
            paymentContext: {
              receiptData,
              meta: {
                transactionIdentifier: singleItemTransactionIdentifier,
              },
            },
          },
        });

        expect(errors?.[0].extensions.code).toEqual("OrderCheckoutError");
      }, 10000);
    });

    describe("Apple Store Server Notifications", () => {
      it("notification_type = INITIAL_BUY", async () => {
        await graphqlFetch({
          query: /* GraphQL */ `
            mutation prepareCart(
              $paymentProviderId: ID!
              $orderId: ID
              $productId: ID!
              $orderPaymentId: ID!
              $meta: JSON
            ) {
              emptyCart(orderId: $orderId) {
                _id
              }
              addCartProduct(productId: $productId, orderId: $orderId) {
                _id
              }
              updateCart(
                orderId: $orderId
                paymentProviderId: $paymentProviderId
              ) {
                _id
              }
              updateOrderPaymentGeneric(
                orderPaymentId: $orderPaymentId
                meta: $meta
              ) {
                _id
                status
              }
            }
          `,
          variables: {
            paymentProviderId: "iap-payment-provider",
            orderPaymentId: "iap-payment2",
            orderId: "iap-order2",
            meta: {
              transactionIdentifier: subscriptionTransactionIdentifier,
            },
            productId: subscriptionProductId,
          },
        });

        const result = await fetch("http://localhost:4010/payment/apple-iap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          duplex: 'half',
          body: JSON.stringify(initialBuy),
        });
        expect(result.status).toBe(200);
        const order = await db
          .collection("orders")
          .findOne({ _id: "iap-order2" });
        expect(order.status).toBe("CONFIRMED");
      }, 10000);
      it("notification_type = DID_RECOVER should just store the current receipt", async () => {
        const result = await fetch("http://localhost:4010/payment/apple-iap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          duplex: 'half',
          body: JSON.stringify(didRecover),
        });
        expect(result.status).toBe(200);
        const enrollment = await db.collection("enrollments").findOne({
          _id: {
            $nin: AllEnrollmentIds,
          },
        });
        expect(enrollment?.status).toBe("ACTIVE");
      }, 10000);

      it("notification_type = DID_CHANGE_RENEWAL_STATUS should terminate enrollment", async () => {
        const result = await fetch("http://localhost:4010/payment/apple-iap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          duplex: 'half',
          body: JSON.stringify(didChangeRenewalStatus),
        });
        expect(result.status).toBe(200);
        const enrollment = await db.collection("enrollments").findOne({
          _id: {
            $nin: AllEnrollmentIds,
          },
        });
        expect(enrollment?.status).toBe("TERMINATED");
      }, 10000);
    });
  });
