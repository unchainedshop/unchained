import test from 'node:test';
import assert from 'node:assert';
import { createLoggedInGraphqlFetch, disconnect, setupDatabase, getServerBaseUrl } from './helpers.js';
import { USER_TOKEN } from './seeds/users.js';
import { SimplePaymentProvider } from './seeds/payments.js';
import { SimpleOrder, SimplePosition, SimplePayment } from './seeds/orders.js';
import webhookReserved from './seeds/payrexx_webhook_reserved.js';

const payrexxInstance = 'unchained-test';

test.describe('Plugins: Payrexx', () => {
  let db;
  let graphqlFetch;

  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);

    // Add a payrexx provider
    await db.collection('payment-providers').findOrInsertOne({
      ...SimplePaymentProvider,
      _id: 'd4d4d4d4d4',
      adapterKey: 'shop.unchained.payment.payrexx',
      type: 'GENERIC',
      configuration: [{ key: 'instance', value: payrexxInstance }],
    });

    // Add a demo order ready to checkout
    await db.collection('order_payments').findOrInsertOne({
      ...SimplePayment,
      _id: '1111112222',
      paymentProviderId: 'd4d4d4d4d4',
      orderId: 'payrexx-order',
    });

    await db.collection('order_positions').findOrInsertOne({
      ...SimplePosition,
      _id: 'payrexx-order-position',
      orderId: 'payrexx-order',
    });

    await db.collection('orders').findOrInsertOne({
      ...SimpleOrder,
      _id: 'payrexx-order',
      orderNumber: 'payrexx',
      paymentId: '1111112222',
    });

    // Add a second demo order ready to checkout
    await db.collection('order_payments').findOrInsertOne({
      ...SimplePayment,
      _id: 'payrexx-payment2',
      paymentProviderId: 'd4d4d4d4d4',
      orderId: 'payrexx-order2',
    });

    await db.collection('order_positions').findOrInsertOne({
      ...SimplePosition,
      _id: 'payrexx-order-position2',
      orderId: 'payrexx-order2',
    });

    await db.collection('orders').findOrInsertOne({
      ...SimpleOrder,
      _id: 'payrexx-order2',
      orderNumber: 'payrexx2',
      paymentId: 'payrexx-payment2',
    });
  });

  test.after(async () => {
    await disconnect();
  });

  test(
    'mutation.signPaymentProviderForCheckout starts transaction and validates',
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
          orderPaymentId: '1111112222',
          transactionContext: {},
        },
      });

      const { status, data } = JSON.parse(signPaymentProviderForCheckout);
      assert.strictEqual(status, 'success');

      const [{ link, hash }] = data;
      const url = `https://${payrexxInstance}.payrexx.com/?payment=${hash}`;
      assert.strictEqual(link, url);

      const result = await fetch(url);
      assert.strictEqual(result.status, 200);
    },
  );

  test('webhook: ignore transaction with status waiting', async () => {
    const webhookBody = {
      transaction: { status: 'waiting' },
    };
    const result = await fetch(`${getServerBaseUrl()}/payment/payrexx`, {
      method: 'POST',
      duplex: 'half',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookBody),
    });
    assert.strictEqual(result.status, 200);
    const text = await result.text();
    assert.ok(text.includes('ignored'));
  });

  test('webhook: checkout order when transaction has status reserved', async () => {
    const webhookBody = {
      ...webhookReserved,
      transaction: {
        ...webhookReserved.transaction,
        referenceId: '1111112222',
        invoice: {
          ...webhookReserved.transaction.invoice,
          paymentRequestId: 1000001,
        },
      },
    };
    const result = await fetch(`${getServerBaseUrl()}/payment/payrexx`, {
      method: 'POST',
      duplex: 'half',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookBody),
    });
    assert.strictEqual(result.status, 200);
  });
});
