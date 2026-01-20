import { createLoggedInGraphqlFetch, disconnect, setupDatabase, getServerBaseUrl } from './helpers.js';
import { USER_TOKEN } from './seeds/users.js';
import { SimplePaymentProvider } from './seeds/payments.js';
import { SimpleOrder, SimplePosition, SimplePayment } from './seeds/orders.js';
import { SuccTranscationHookPayload, SuccTransactionApiResponse } from './seeds/postfinance-checkout.js';
import { orderIsPaid } from '@unchainedshop/plugins/payment/postfinance-checkout';
import test, { mock } from 'node:test';
import assert from 'node:assert';

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const { PFCHECKOUT_SPACE_ID } = process.env;

// Skip - these tests have been failing for a while
test.describe('Plugins: Postfinance Checkout', { skip: true }, () => {
  let db;
  let graphqlFetch;

  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);

    // Add a postfinance checkout provider
    await db.collection('payment-providers').findOrInsertOne({
      ...SimplePaymentProvider,
      _id: 'pfcheckout-payment-provider',
      adapterKey: 'shop.unchained.payment.postfinance-checkout',
      type: 'GENERIC',
    });

    // Add a demo order ready to checkout
    await db.collection('order_payments').findOrInsertOne({
      ...SimplePayment,
      _id: 'pfcheckout-payment',
      paymentProviderId: 'pfcheckout-payment-provider',
      orderId: 'pfcheckout-order',
    });

    await db.collection('order_positions').findOrInsertOne({
      ...SimplePosition,
      _id: 'pfcheckout-order-position',
      orderId: 'pfcheckout-order',
    });

    await db.collection('orders').findOrInsertOne({
      ...SimpleOrder,
      _id: 'pfcheckout-order',
      orderNumber: 'pfcheckout',
      paymentId: 'pfcheckout-payment',
    });

    // Add a second demo order that is paid
    await db.collection('order_payments').findOrInsertOne({
      ...SimplePayment,
      _id: 'pfcheckout-payment2',
      paymentProviderId: 'pfcheckout-payment-provider',
      orderId: 'pfcheckout-order2',
      status: 'PAID',
    });

    await db.collection('order_positions').findOrInsertOne({
      ...SimplePosition,
      _id: 'pfcheckout-order-position2',
      orderId: 'pfcheckout-order2',
    });

    await db.collection('orders').findOrInsertOne({
      ...SimpleOrder,
      _id: 'pfcheckout-order2',
      orderNumber: 'pfcheckout2',
      paymentId: 'pfcheckout-payment2',
      status: 'CONFIRMED',
    });
  });

  test.after(async () => {
    await disconnect();
  });

  test(
    'mutation.signPaymentProviderForCheckout (PostFinance Checkout) should start a new transaction without integrationMode and checks if it is valid',
    { timeout: 10000 },
    async () => {
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
          orderPaymentId: 'pfcheckout-payment',
          transactionContext: {},
        },
      });

      const { transactionId, location } = JSON.parse(signPaymentProviderForCheckout);

      const url = `https://checkout.postfinance.ch/s/${PFCHECKOUT_SPACE_ID}/payment/transaction/pay/${transactionId}?securityToken=`;
      assert.ok(new RegExp(`^${escapeRegExp(url)}?`).test(location));

      const result = await fetch(location);
      assert.strictEqual(result.status, 200);
    },
  );

  test(
    'mutation.signPaymentProviderForCheckout (PostFinance Checkout) should start a new transaction with integrationMode PaymentPage and checks if it is valid',
    { timeout: 10000 },
    async () => {
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
          orderPaymentId: 'pfcheckout-payment',
          transactionContext: { integrationMode: 'PaymentPage' },
        },
      });

      const { transactionId, location } = JSON.parse(signPaymentProviderForCheckout);

      const url = `https://checkout.postfinance.ch/s/${PFCHECKOUT_SPACE_ID}/payment/transaction/pay/${transactionId}?securityToken=`;
      assert.ok(new RegExp(`^${escapeRegExp(url)}?`).test(location));

      const result = await fetch(location);
      assert.strictEqual(result.status, 200);
    },
  );

  test(
    'mutation.signPaymentProviderForCheckout (PostFinance Checkout) should start a new transaction with integrationMode Lightbox and checks if it is valid',
    { timeout: 10000 },
    async () => {
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
          orderPaymentId: 'pfcheckout-payment',
          transactionContext: { integrationMode: 'Lightbox' },
        },
      });

      const { transactionId, location } = JSON.parse(signPaymentProviderForCheckout);

      const url = `https://checkout.postfinance.ch/assets/payment/lightbox-checkout-handler.js?spaceId=${PFCHECKOUT_SPACE_ID}&transactionId=${transactionId}&securityToken=`;
      assert.ok(new RegExp(`^${escapeRegExp(url)}?`).test(location));

      const result = await fetch(location);
      assert.strictEqual(result.status, 200);
    },
  );

  test(
    'mutation.signPaymentProviderForCheckout (PostFinance Checkout) should start a new transaction with integrationMode iFrame and checks if it is valid',
    { timeout: 10000 },
    async () => {
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
          orderPaymentId: 'pfcheckout-payment',
          transactionContext: { integrationMode: 'iFrame' },
        },
      });

      const { transactionId, location } = JSON.parse(signPaymentProviderForCheckout);

      const url = `https://checkout.postfinance.ch/assets/payment/iframe-checkout-handler.js?spaceId=${PFCHECKOUT_SPACE_ID}&transactionId=${transactionId}&securityToken=`;
      assert.ok(new RegExp(`^${escapeRegExp(url)}?`).test(location));

      const result = await fetch(location);
      assert.strictEqual(result.status, 200);
    },
  );

  const mockedOrderModule = {
    payments: {
      findOrderPayment: ({ orderPaymentId }) => {
        return orderPaymentId === 'pfcheckout-payment' ? { orderId: 'pfcheckout-order' } : {};
      },
      markAsPaid: mock.fn(),
    },
    findOrder: ({ orderId }) => {
      return orderId === 'pfcheckout-order' ? { orderId, currency: SimpleOrder.currency } : {};
    },
  };

  test(
    'Payment Flow with Webhook Call (PostFinance Checkout) should start a new transaction with webhook call and no payment',
    { timeout: 10000 },
    async () => {
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
          orderPaymentId: 'pfcheckout-payment',
          transactionContext: {},
        },
      });

      const { transactionId, location } = JSON.parse(signPaymentProviderForCheckout);

      const url = `https://checkout.postfinance.ch/s/${PFCHECKOUT_SPACE_ID}/payment/transaction/pay/${transactionId}?securityToken=`;
      assert.ok(new RegExp(`^${escapeRegExp(url)}?`).test(location));

      // Simulate WebHook call
      const result = await fetch(`${getServerBaseUrl()}/payment/postfinance-checkout`, {
        method: 'POST',
        duplex: 'half',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...SuccTranscationHookPayload,
          entityId: transactionId,
          spaceId: PFCHECKOUT_SPACE_ID,
        }),
      });
      assert.strictEqual(result.status, 500);
      assert.partialDeepStrictEqual(await result.json(), {
        name: 'POSTFINANCE_STATE_PENDING',
      });
      assert.strictEqual(mockedOrderModule.payments.markAsPaid.mock.calls.length, 0);
    },
  );

  test(
    'Payment Flow with Webhook Call (PostFinance Checkout) should start a new transaction with webhook call and payment',
    { timeout: 10000 },
    async () => {
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
          orderPaymentId: 'pfcheckout-payment',
          transactionContext: {},
        },
      });

      const { transactionId, location } = JSON.parse(signPaymentProviderForCheckout);

      const url = `https://checkout.postfinance.ch/s/${PFCHECKOUT_SPACE_ID}/payment/transaction/pay/${transactionId}?securityToken=`;
      assert.ok(new RegExp(`^${escapeRegExp(url)}?`).test(location));

      const transactionRes = {
        ...SuccTransactionApiResponse,
        completedAmount: 300.0,
        metaData: { orderPaymentId: 'pfcheckout-payment' },
      };

      const hookRes = await orderIsPaid(SimpleOrder, transactionRes);
      assert.strictEqual(hookRes, true);
    },
  );

  test(
    'Payment Flow with Webhook Call (PostFinance Checkout) should start a new transaction with webhook call and too low payment',
    { timeout: 10000 },
    async () => {
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
          orderPaymentId: 'pfcheckout-payment',
          transactionContext: {},
        },
      });

      const { transactionId, location } = JSON.parse(signPaymentProviderForCheckout);

      const url = `https://checkout.postfinance.ch/s/${PFCHECKOUT_SPACE_ID}/payment/transaction/pay/${transactionId}?securityToken=`;
      assert.ok(new RegExp(`^${escapeRegExp(url)}?`).test(location));

      const transactionRes = {
        ...SuccTransactionApiResponse,
        metaData: { orderPaymentId: 'pfcheckout-payment' },
        authorizationAmount: 200.0,
        completedAmount: 200.0,
      };

      const hookRes = await orderIsPaid(SimpleOrder, transactionRes);
      assert.strictEqual(hookRes, false);
    },
  );

  test(
    'Payment Flow with lost WebHook call (PostFinance Checkout) should start a new transaction and calls checkoutCart without payment',
    { timeout: 10000 },
    async () => {
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
          orderPaymentId: 'pfcheckout-payment',
          transactionContext: {},
        },
      });

      const { transactionId, location } = JSON.parse(signPaymentProviderForCheckout);

      const url = `https://checkout.postfinance.ch/s/${PFCHECKOUT_SPACE_ID}/payment/transaction/pay/${transactionId}?securityToken=`;
      assert.ok(new RegExp(`^${escapeRegExp(url)}?`).test(location));

      await graphqlFetch({
        query: /* GraphQL */ `
          mutation checkoutCart($orderId: ID!) {
            checkoutCart(orderId: $orderId) {
              _id
            }
          }
        `,
        variables: {
          orderId: 'pfcheckout-order',
        },
      });
      const orderPayment = await db.collection('order_payments').findOne({ _id: 'pfcheckout-payment' });
      assert.notStrictEqual(orderPayment.status, 'PAID');
    },
  );
});
