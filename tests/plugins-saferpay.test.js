import test from 'node:test';
import assert from 'node:assert';
import { createLoggedInGraphqlFetch, disconnect, setupDatabase } from './helpers.js';
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
  await fetch(redirect.url, {
    method: 'POST',
    duplex: 'half',
    body: new URLSearchParams({
      selectionId: '1510', // Twint, no user input required
    }),
  });
  await new Promise((r) => setTimeout(r, 10000)); // Need to wait a few seconds after request
};

if (SAFERPAY_CUSTOMER_ID && SAFERPAY_PW) {
  const terminalId = '17766514';

  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);

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

  test.after(async () => {
    await disconnect();
  });

  test('starts a new transaction and validates', { timeout: 10000 }, async () => {
    const {
      data: { signPaymentProviderForCheckout },
    } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation signPaymentProviderForCheckout($transactionContext: JSON, $orderPaymentId: ID!) {
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
    const { location, transactionId } = JSON.parse(signPaymentProviderForCheckout);

    assert.ok(
      location.startsWith(
        `https://test.saferpay.com/vt2/api/PaymentPage/${SAFERPAY_CUSTOMER_ID}/${terminalId}/`,
      ),
    );
    assert.ok(transactionId);

    const result = await fetch(location);
    assert.strictEqual(result.status, 200);
  });

  test('starts a new transaction with no payment', { timeout: 10000 }, async () => {
    const {
      data: { signPaymentProviderForCheckout },
    } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation signPaymentProviderForCheckout($transactionContext: JSON, $orderPaymentId: ID!) {
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

    const { location, transactionId } = JSON.parse(signPaymentProviderForCheckout);

    assert.ok(
      location.startsWith(
        `https://test.saferpay.com/vt2/api/PaymentPage/${SAFERPAY_CUSTOMER_ID}/${terminalId}/`,
      ),
    );

    await graphqlFetch({
      query: /* GraphQL */ `
        mutation checkoutCart($orderId: ID!, $paymentContext: JSON) {
          checkoutCart(orderId: $orderId, paymentContext: $paymentContext) {
            _id
          }
        }
      `,
      variables: {
        orderId: 'saferpay-order',
        paymentContext: {
          transactionId: transactionId,
        },
      },
    });

    const orderPayment = await db.collection('order_payments').findOne({ _id: 'saferpay-payment' });
    assert.notStrictEqual(orderPayment.status, 'PAID');
  });

  test('starts a new transaction with payment', { timeout: 20000 }, async () => {
    const {
      data: { signPaymentProviderForCheckout },
    } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation signPaymentProviderForCheckout($transactionContext: JSON, $orderPaymentId: ID!) {
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

    const { location, transactionId } = JSON.parse(signPaymentProviderForCheckout);

    assert.ok(
      location.startsWith(
        `https://test.saferpay.com/vt2/api/PaymentPage/${SAFERPAY_CUSTOMER_ID}/${terminalId}/`,
      ),
    );

    await simulatePayment(location);

    await graphqlFetch({
      query: /* GraphQL */ `
        mutation checkoutCart($orderId: ID!, $paymentContext: JSON) {
          checkoutCart(orderId: $orderId, paymentContext: $paymentContext) {
            _id
          }
        }
      `,
      variables: {
        orderId: 'saferpay-order2',
        paymentContext: {
          transactionId,
        },
      },
    });

    const orderPayment = await db.collection('order_payments').findOne({ _id: 'saferpay-payment2' });
    assert.strictEqual(orderPayment.status, 'PAID');
  });
} else {
  test.skip('Plugins: Worldline Saferpay Payments', () => {
    console.log('skipped - secret not set');
  });
}
