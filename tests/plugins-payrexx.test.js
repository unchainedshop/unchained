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

    // Add a datatrans provider
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
      orderNumber: 'datatrans',
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
      orderNumber: 'datatrans2',
      paymentId: 'payrexx-payment2',
    });
  });

  // describe('Mutation.signPaymentProviderForCredentialRegistration (Datatrans)', () => {
  //   it('starts a new transaction and checks if it is valid', async () => {
  //     const { data: { signPaymentProviderForCredentialRegistration } = {} } =
  //       await graphqlFetch({
  //         query: /* GraphQL */ `
  //           mutation signPaymentProviderForCredentialRegistration(
  //             $paymentProviderId: ID!
  //           ) {
  //             signPaymentProviderForCredentialRegistration(
  //               paymentProviderId: $paymentProviderId
  //             )
  //           }
  //         `,
  //         variables: {
  //           paymentProviderId: 'd4d4d4d4d4',
  //         },
  //       });

  //     const { location, transactionId } = JSON.parse(
  //       signPaymentProviderForCredentialRegistration,
  //     );

  //     const url = `https://pay.sandbox.datatrans.com/v1/start/${transactionId}`;
  //     expect(location).toBe(url);

  //     const result = await fetch(url);
  //     const text = await result.text();
  //     expect(text).not.toMatch(/incorrect request/);
  //     expect(text).not.toMatch(/error/);
  //   });
  // });

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

  describe('Payrexx Hooks', () => {
    // it.only('mocks ingress accepted card_check webhook call', async () => {
    //   const paymentProviderId = 'd4d4d4d4d4';
    //   const transactionId = 'card_check_authorized';
    //   const userId = User._id;
    //   const sign =
    //     '5118c93025fdb16a110cdde3aa7669422da320cfe9478e35b531f45c4619d4db';
    //   const refno = Buffer.from(paymentProviderId, "hex").toString("base64");
    //   const result = await fetch(
    //     'http://localhost:4010/payment/payrexx/webhook',
    //     {
    //       method: 'POST',
    //       duplex: 'half',
    //       headers: {
    //         'Content-Type': 'application/json',
    //         'payrexx-signature': `t=12424123412,s0=${sign}`,
    //       },
    //       body: JSON.stringify(),
    //     },
    //   );
    //   expect(result.status).toBe(200);

    //   const paymentCredential = await db
    //     .collection('payment_credentials')
    //     .findOne({ paymentProviderId });

    //   expect(paymentCredential).not.toBe(null);
    // });
    // it('mocks ingress accepted card_check webhook call with wrong signature', async () => {
    //   const paymentProviderId = 'd4d4d4d4d4';
    //   const transactionId = 'card_check_authorized';
    //   const userId = User._id;
    //   const sign =
    //     '9172ee1619aa404f4904e9b2993ba7cc1783d6880aa170cd9c0531232ee5de64';
    //   const refno = Buffer.from(paymentProviderId, "hex").toString("base64");
    //   const result = await fetch(
    //     'http://localhost:4010/payment/payrexx/webhook',
    //     {
    //       method: 'POST',
    //       duplex: 'half',
    //       headers: {
    //         'Content-Type': 'application/json',
    //         'payrexx-signature': `t=12424123412,s0=${sign}WRONG`,
    //       },
    //       body: `{"card":{"3D":{"authenticationResponse":"D"},"alias":"70119122433810042","expiryMonth":"12","expiryYear":"21","info":{"brand":"VISA CREDIT","country":"GB","issuer":"DATATRANS","type":"credit","usage":"consumer"},"masked":"424242xxxxxx4242"},"currency":"${currency}","detail":{"authorize":{"acquirerAuthorizationCode":"100055"}},"history":[{"action":"init","date":"2021-09-03T08:00:32Z","ip":"212.232.234.26","source":"api","success":true},{"action":"authorize","date":"2021-09-03T08:00:55Z","ip":"212.232.234.26","source":"redirect","success":true}],"language":"de","paymentMethod":"VIS","refno":"${refno}","refno2":"${userId}","status":"authorized","transactionId":"${transactionId}","type":"card_check"}`,
    //     },
    //   );

    //   expect(result.status).toBe(403);
    // });
    
    it('mocks ingress accepted payment webhook call (status reserved)', async () => {
      const webhookBody = {
        ...webhookReserved,
        transaction: {
          ...webhookReserved.transaction,
          id: 'payment_reserved_low_amount',
          referenceId: '1111112222',
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
      console.log(await result.text())
      expect(result.status).toBe(200);
    });

    // it('mocks ingress accepted payment webhook call with correct currency/amount', async () => {
    //   const orderPaymentId = '1111112222';
    //   const transactionId = 'payment_authorized';
    //   const userId = User._id;
    //   const sign =
    //     'a146037afae54a78b61865b9c2bb38a60c687692833a1388a03176574cb2a004';
    //   const refno = Buffer.from(orderPaymentId, "hex").toString("base64");
    //   const result = await fetch(
    //     'http://localhost:4010/payment/payrexx/webhook',
    //     {
    //       method: 'POST',
    //       duplex: 'half',
    //       headers: {
    //         'Content-Type': 'application/json',
    //         'payrexx-signature': `t=12424123412,s0=${sign}`,
    //       },
    //       body: `{"card":{"3D":{"authenticationResponse":"D"},"alias":"70119122433810042","expiryMonth":"12","expiryYear":"21","info":{"brand":"VISA CREDIT","country":"GB","issuer":"DATATRANS","type":"credit","usage":"consumer"},"masked":"424242xxxxxx4242"},"currency": "${currency}","detail":{"authorize":{"acquirerAuthorizationCode":"100055", "amount": ${amount}}},"history":[{"action":"init","date":"2021-09-03T08:00:32Z","ip":"212.232.234.26","source":"api","success":true},{"action":"authorize","date":"2021-09-03T08:00:55Z","ip":"212.232.234.26","source":"redirect","success":true}],"language":"de","paymentMethod":"VIS","refno":"${refno}","refno2":"${userId}","status":"authorized","transactionId":"${transactionId}","type":"payment"}`,
    //     },
    //   );

    //   expect(result.status).toBe(200);

    //   const order = await db
    //     .collection('orders')
    //     .findOne({ _id: 'payrexx-order' });
    //   expect(order.status).toBe('CONFIRMED');

    //   const orderPayment = await db
    //     .collection('order_payments')
    //     .findOne({ _id: orderPaymentId });
    //   expect(orderPayment.status).toBe('PAID');
    // });
  });

});
