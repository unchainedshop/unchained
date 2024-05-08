import { createLoggedInGraphqlFetch, setupDatabase } from './helpers.js';
import { USER_TOKEN, User } from './seeds/users.js';
import { SimplePaymentProvider } from './seeds/payments.js';
import { SimpleOrder, SimplePosition, SimplePayment } from './seeds/orders.js';

import webhookReserved from "./seeds/payrexx_webhook_reserved.js";

let db;
let graphqlFetch;

const payrexxInstance = 'unchained-test';

describe('Plugins: Payrexx Payments', () => {
  const merchantId = '1100004624';
  const amount = '20000';
  const currency = 'CHF';

  beforeAll(async () => {
    [db] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(USER_TOKEN);

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


  describe('mutation.signPaymentProviderForCheckout (Datatrans) should', () => {
    it('starts a new transaction and checks if it is valid', async () => {
      import.meta.jest.setTimeout(10000);
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
          orderPaymentId: '1111112222',
          transactionContext: {},
        },
      });

      const { status, data } = JSON.parse(
        signPaymentProviderForCheckout,
      );
      
      expect(status).toBe('success');

      const [{ link, hash }] = data;
      const url = `https://${payrexxInstance}.payrexx.com/?payment=${hash}`;
      expect(link).toBe(url);

      const result = await fetch(url);
      expect(result.status).toBe(200)
    });
  });

  describe('webhook', () => {
    it('should ignore a transaction with status "waiting"', async () => {
      const webhookBody = {
        transaction: {
          status: 'waiting'
        }
      };
      const result = await fetch(
        'http://localhost:4010/payment/payrexx',
        {
          method: 'POST',
          duplex: 'half',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookBody),
        },
      );
      expect(result.status).toBe(200);
      expect(await result.text()).toContain('ignored')
    });
    
    it('should checkout the order when the transaction has status "reserved"', async () => {
      const webhookBody = {
        ...webhookReserved,
        transaction: {
          ...webhookReserved.transaction,
          referenceId: '1111112222',
          invoice: {
            ...webhookReserved.transaction.invoice,
            paymentRequestId: 1000001,
          }
        }
      };
      const result = await fetch(
        'http://localhost:4010/payment/payrexx',
        {
          method: 'POST',
          duplex: 'half',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookBody),
        },
      );
      expect(result.status).toBe(200);
    });
  });

});
