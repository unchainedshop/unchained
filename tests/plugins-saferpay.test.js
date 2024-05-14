import { createLoggedInGraphqlFetch, setupDatabase } from './helpers.js';
import { USER_TOKEN } from './seeds/users.js';
import { SimplePaymentProvider } from './seeds/payments.js';
import { SimpleOrder, SimplePosition, SimplePayment } from './seeds/orders.js';

let db;
let graphqlFetch;
const { SAFERPAY_CUSTOMER_ID, SAFERPAY_PW } = process.env;

const simulatePayment = async (paymentPageUrl) => {
  const redirect = await fetch(paymentPageUrl, {
    redirect: 'follow',
    follow: 10,
  });
  const response = await fetch(redirect.url, {
    method: 'POST',
    duplex: 'half',
    body: new URLSearchParams({
      selectionId: '1510' // Twint, no user input required
    }),
  });
  await new Promise(r => setTimeout(r, 4000)); // Need to wait a few seconds after request
}

if (SAFERPAY_CUSTOMER_ID && SAFERPAY_PW) {
  const terminalId = '17766514';

  describe('Plugins: Worldline Saferpay Payments', () => {

    beforeAll(async () => {
      [db] = await setupDatabase();
      graphqlFetch = await createLoggedInGraphqlFetch(USER_TOKEN);

      // Add a worldline saferpay provider
      await db.collection('payment-providers').findOrInsertOne({
        ...SimplePaymentProvider,
        _id: 'saferpay-payment-provider',
        adapterKey: 'shop.unchained.payment.saferpay',
        type: 'GENERIC',
        configuration: [{ key: 'terminalId', value: terminalId }],
      });

      // Add a demo order ready to checkout
      await db.collection('order_payments').findOrInsertOne({
        ...SimplePayment,
        _id: 'saferpay-payment',
        paymentProviderId: 'saferpay-payment-provider',
        orderId: 'saferpay-order',
      });

      await db.collection('order_positions').findOrInsertOne({
        ...SimplePosition,
        _id: 'saferpay-order-position',
        orderId: 'saferpay-order',
      });

      await db.collection('orders').findOrInsertOne({
        ...SimpleOrder,
        _id: 'saferpay-order',
        orderNumber: 'saferpay',
        paymentId: 'saferpay-payment',
      });

      await db.collection('order_payments').findOrInsertOne({
        ...SimplePayment,
        _id: 'saferpay-payment2',
        paymentProviderId: 'saferpay-payment-provider',
        orderId: 'saferpay-order2',
      });

      await db.collection('order_positions').findOrInsertOne({
        ...SimplePosition,
        _id: 'saferpay-order-position2',
        orderId: 'saferpay-order2',
      });

      await db.collection('orders').findOrInsertOne({
        ...SimpleOrder,
        _id: 'saferpay-order2',
        orderNumber: 'saferpay2',
        paymentId: 'saferpay-payment2',
      });
    });

    describe('mutation.signPaymentProviderForCheckout (Worldline Saferpay) should', () => {
      it('starts a new transaction and checks if it is valid', async () => {
        const {
          data: { signPaymentProviderForCheckout },
        } = await graphqlFetch({
        // const res = await graphqlFetch({
          query: /* GraphQL */ `
          mutation signPaymentProviderForCheckout(
            $transactionContext: JSON
            $orderPaymentId: ID!
          ) {
            signPaymentProviderForCheckout(
              transactionContext: $transactionContext
              orderPaymentId: $orderPaymentId
            )
          }
        `,
          variables: {
            orderPaymentId: 'saferpay-payment',
            transactionContext: {},
          },
        });

        const { location, transactionId } = JSON.parse(
          signPaymentProviderForCheckout,
        );

        expect(
          location.startsWith(`https://test.saferpay.com/vt2/api/PaymentPage/${SAFERPAY_CUSTOMER_ID}/${terminalId}/`)
          ).toBeTruthy();
        expect(transactionId).toBeTruthy();

        const result = await fetch(location);
        expect(result.status).toBe(200);
      }, 10000);
    });

    describe('Payment Flow (Worldline Saferpay) should', () => {

      it('starts a new transaction with no payment', async () => {
        const {
          data: { signPaymentProviderForCheckout },
        } = await graphqlFetch({
          query: /* GraphQL */ `
          mutation signPaymentProviderForCheckout(
            $transactionContext: JSON
            $orderPaymentId: ID!
          ) {
            signPaymentProviderForCheckout(
              transactionContext: $transactionContext
              orderPaymentId: $orderPaymentId
            )
          }
        `,
          variables: {
            orderPaymentId: 'saferpay-payment',
            transactionContext: {},
          },
        });


        const { location, transactionId } = JSON.parse(
          signPaymentProviderForCheckout,
        );

        expect(
          location.startsWith(`https://test.saferpay.com/vt2/api/PaymentPage/${SAFERPAY_CUSTOMER_ID}/${terminalId}/`)
        ).toBeTruthy();

        await graphqlFetch({
          query: /* GraphQL */ `
          mutation checkoutCart(
            $orderId: ID!
            $paymentContext: JSON
          ) {
            checkoutCart(orderId: $orderId, paymentContext: $paymentContext) { 
                _id
            }
          }
        `,
          variables: {
            orderId: 'saferpay-order',
            paymentContext: {
              transactionId: transactionId
            }
          },
        });

        const orderPayment = await db.collection("order_payments").findOne({ _id: "saferpay-payment" });
        expect(orderPayment.status).not.toBe("PAID");
      }, 10000);

      it('starts a new transaction with payment', async () => {
        const {
          data: { signPaymentProviderForCheckout },
        } = await graphqlFetch({
          query: /* GraphQL */ `
          mutation signPaymentProviderForCheckout(
            $transactionContext: JSON
            $orderPaymentId: ID!
          ) {
            signPaymentProviderForCheckout(
              transactionContext: $transactionContext
              orderPaymentId: $orderPaymentId
            )
          }
        `,
          variables: {
            orderPaymentId: 'saferpay-payment2',
            transactionContext: {},
          },
        });


        const { location, transactionId } = JSON.parse(
          signPaymentProviderForCheckout,
        );

        expect(
          location.startsWith(`https://test.saferpay.com/vt2/api/PaymentPage/${SAFERPAY_CUSTOMER_ID}/${terminalId}/`)
        ).toBeTruthy();

        await simulatePayment(location);

        const {
          data, errors,
        } = await graphqlFetch({
          query: /* GraphQL */ `
          mutation checkoutCart(
            $orderId: ID!
            $paymentContext: JSON
          ) {
            checkoutCart(orderId: $orderId, paymentContext: $paymentContext) { 
                _id
            }
          }
        `,
          variables: {
            orderId: 'saferpay-order2',
            paymentContext: {
              transactionId
            }
          },
        });

        const orderPayment = await db.collection("order_payments").findOne({ _id: "saferpay-payment2" });
        expect(orderPayment.status).toBe("PAID");
      }, 15000);
    });

  });
} else {
  describe.skip('Plugins: Worldline Saferpay Payments', () => {
    it('Skipped because secret not set', async () => {
      console.log('skipped'); // eslint-disable-line
    });
  });
}
