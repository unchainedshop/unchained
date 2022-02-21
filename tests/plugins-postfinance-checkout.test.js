import fetch from 'isomorphic-unfetch';
import { createLoggedInGraphqlFetch, setupDatabase } from './helpers';
import { USER_TOKEN, User } from './seeds/users';
import { SimplePaymentProvider } from './seeds/payments';
import { SimpleOrder, SimplePosition, SimplePayment } from './seeds/orders';

let db;
let graphqlFetch;
const { PFCHECKOUT_SPACE_ID, PFCHECKOUT_USER_ID, PFCHECKOUT_SECRET } = process.env;

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

if (PFCHECKOUT_SPACE_ID && PFCHECKOUT_USER_ID && PFCHECKOUT_SECRET) {
  describe('Plugins: Postfinance Checkout Payments', () => {

    beforeAll(async () => {
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

      // Add a second demo order ready to checkout
      await db.collection('order_payments').findOrInsertOne({
        ...SimplePayment,
        _id: 'pfcheckout-payment2',
        paymentProviderId: 'pfcheckout-payment-provider',
        orderId: 'pfcheckout-order2',
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
      });
    });

    describe('mutation.signPaymentProviderForCheckout (PostFinance Checkout) should', () => {
      it('starts a new transaction without integrationMode and checks if it is valid', async () => {
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
            orderPaymentId: 'pfcheckout-payment',
            transactionContext: {},
          },
        });

        const { transactionId, location } = JSON.parse(
          signPaymentProviderForCheckout,
        );

        const url = `https://checkout.postfinance.ch/s/${PFCHECKOUT_SPACE_ID}/payment/transaction/pay/${transactionId}?securityToken=`;
        expect(location).toMatch(new RegExp(`^${escapeRegExp(url)}?`));

        const result = await fetch(location);
        expect(result.status).toBe(200);
      }, 10000);

      it('starts a new transaction with integrationMode PaymentPage and checks if it is valid', async () => {
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
            orderPaymentId: 'pfcheckout-payment',
            transactionContext: { integrationMode: 'PaymentPage' },
          },
        });

        const { transactionId, location } = JSON.parse(
          signPaymentProviderForCheckout,
        );

        const url = `https://checkout.postfinance.ch/s/${PFCHECKOUT_SPACE_ID}/payment/transaction/pay/${transactionId}?securityToken=`;
        expect(location).toMatch(new RegExp(`^${escapeRegExp(url)}?`));

        const result = await fetch(location);
        expect(result.status).toBe(200);
      }, 10000);

      it('starts a new transaction with integrationMode Lightbox and checks if it is valid', async () => {
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
            orderPaymentId: 'pfcheckout-payment',
            transactionContext: { integrationMode: 'Lightbox' },
          },
        });

        const { transactionId, location } = JSON.parse(
          signPaymentProviderForCheckout,
        );

        const url = `https://checkout.postfinance.ch/assets/payment/lightbox-checkout-handler.js?spaceId=${PFCHECKOUT_SPACE_ID}&transactionId=${transactionId}&securityToken=`;
        expect(location).toMatch(new RegExp(`^${escapeRegExp(url)}?`));

        const result = await fetch(location);
        expect(result.status).toBe(200);
      }, 10000);

      it('starts a new transaction with integrationMode iFrame and checks if it is valid', async () => {
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
            orderPaymentId: 'pfcheckout-payment',
            transactionContext: { integrationMode: 'iFrame' },
          },
        });

        const { transactionId, location } = JSON.parse(
          signPaymentProviderForCheckout,
        );

        const url = `https://checkout.postfinance.ch/assets/payment/iframe-checkout-handler.js?spaceId=${PFCHECKOUT_SPACE_ID}&transactionId=${transactionId}&securityToken=`;
        expect(location).toMatch(new RegExp(`^${escapeRegExp(url)}?`));

        const result = await fetch(location);
        expect(result.status).toBe(200);
      }, 10000);

    });




    // describe('Datatrans Hooks', () => {
    //   it('mocks ingress accepted card_check webhook call', async () => {
    //     const paymentProviderId = 'datatrans-payment-provider';
    //     const transactionId = 'card_check_authorized';
    //     const userId = User._id;
    //     const sign =
    //       '9172ee1619aa404f4904e9b2993ba7cc1783d6880aa170cd9c0531232ee5de64';
    //     const result = await fetch(
    //       'http://localhost:3000/payment/datatrans/webhook',
    //       {
    //         method: 'POST',
    //         headers: {
    //           'Content-Type': 'application/json',
    //           'datatrans-signature': `t=12424123412,s0=${sign}`,
    //         },
    //         body: `{"card":{"3D":{"authenticationResponse":"D"},"alias":"70119122433810042","expiryMonth":"12","expiryYear":"21","info":{"brand":"VISA CREDIT","country":"GB","issuer":"DATATRANS","type":"credit","usage":"consumer"},"masked":"424242xxxxxx4242"},"currency":"${currency}","detail":{"authorize":{"acquirerAuthorizationCode":"100055"}},"history":[{"action":"init","date":"2021-09-03T08:00:32Z","ip":"212.232.234.26","source":"api","success":true},{"action":"authorize","date":"2021-09-03T08:00:55Z","ip":"212.232.234.26","source":"redirect","success":true}],"language":"de","paymentMethod":"VIS","refno":"${paymentProviderId}","refno2":"${userId}","status":"authorized","transactionId":"${transactionId}","type":"card_check"}`,
    //       },
    //     );

    //     expect(result.status).toBe(200);

    //     const paymentCredential = await db
    //       .collection('payment_credentials')
    //       .findOne({ paymentProviderId });

    //     expect(paymentCredential).not.toBe(null);
    //   });
    //   it('mocks ingress accepted card_check webhook call with wrong signature', async () => {
    //     const paymentProviderId = 'datatrans-payment-provider';
    //     const transactionId = 'card_check_authorized';
    //     const userId = User._id;
    //     const sign =
    //       '9172ee1619aa404f4904e9b2993ba7cc1783d6880aa170cd9c0531232ee5de64';
    //     const result = await fetch(
    //       'http://localhost:3000/payment/datatrans/webhook',
    //       {
    //         method: 'POST',
    //         headers: {
    //           'Content-Type': 'application/json',
    //           'datatrans-signature': `t=12424123412,s0=${sign}WRONG`,
    //         },
    //         body: `{"card":{"3D":{"authenticationResponse":"D"},"alias":"70119122433810042","expiryMonth":"12","expiryYear":"21","info":{"brand":"VISA CREDIT","country":"GB","issuer":"DATATRANS","type":"credit","usage":"consumer"},"masked":"424242xxxxxx4242"},"currency":"${currency}","detail":{"authorize":{"acquirerAuthorizationCode":"100055"}},"history":[{"action":"init","date":"2021-09-03T08:00:32Z","ip":"212.232.234.26","source":"api","success":true},{"action":"authorize","date":"2021-09-03T08:00:55Z","ip":"212.232.234.26","source":"redirect","success":true}],"language":"de","paymentMethod":"VIS","refno":"${paymentProviderId}","refno2":"${userId}","status":"authorized","transactionId":"${transactionId}","type":"card_check"}`,
    //       },
    //     );

    //     expect(result.status).toBe(403);
    //   });
    //   it('mocks ingress accepted payment webhook call with diff amount', async () => {
    //     const orderPaymentId = 'datatrans-payment';
    //     const transactionId = 'payment_authorized_low_amount';
    //     const userId = User._id;
    //     const sign =
    //       '6b266c38f1b9b626112facbd033a834b33a0cd69163215ff9a5d2bf606abc905';
    //     const result = await fetch(
    //       'http://localhost:3000/payment/datatrans/webhook',
    //       {
    //         method: 'POST',
    //         headers: {
    //           'Content-Type': 'application/json',
    //           'datatrans-signature': `t=12424123412,s0=${sign}`,
    //         },
    //         body: `{"card":{"3D":{"authenticationResponse":"D"},"alias":"70119122433810042","expiryMonth":"12","expiryYear":"21","info":{"brand":"VISA CREDIT","country":"GB","issuer":"DATATRANS","type":"credit","usage":"consumer"},"masked":"424242xxxxxx4242"},"currency": "${currency}","detail":{"authorize":{"acquirerAuthorizationCode":"100055", "amount": ${amount}}},"history":[{"action":"init","date":"2021-09-03T08:00:32Z","ip":"212.232.234.26","source":"api","success":true},{"action":"authorize","date":"2021-09-03T08:00:55Z","ip":"212.232.234.26","source":"redirect","success":true}],"language":"de","paymentMethod":"VIS","refno":"${orderPaymentId}","refno2":"${userId}","status":"authorized","transactionId":"${transactionId}","type":"payment"}`,
    //       },
    //     );

    //     expect(result.status).toBe(500);
    //   });
    //   it('mocks ingress accepted payment webhook call with correct currency/amount', async () => {
    //     const orderPaymentId = 'datatrans-payment';
    //     const transactionId = 'payment_authorized';
    //     const userId = User._id;
    //     const sign =
    //       '3c81fc77a52c6f2956ef484875c86756c8e49b4d708b7dc3c331090276ace31c';
    //     const result = await fetch(
    //       'http://localhost:3000/payment/datatrans/webhook',
    //       {
    //         method: 'POST',
    //         headers: {
    //           'Content-Type': 'application/json',
    //           'datatrans-signature': `t=12424123412,s0=${sign}`,
    //         },
    //         body: `{"card":{"3D":{"authenticationResponse":"D"},"alias":"70119122433810042","expiryMonth":"12","expiryYear":"21","info":{"brand":"VISA CREDIT","country":"GB","issuer":"DATATRANS","type":"credit","usage":"consumer"},"masked":"424242xxxxxx4242"},"currency": "${currency}","detail":{"authorize":{"acquirerAuthorizationCode":"100055", "amount": ${amount}}},"history":[{"action":"init","date":"2021-09-03T08:00:32Z","ip":"212.232.234.26","source":"api","success":true},{"action":"authorize","date":"2021-09-03T08:00:55Z","ip":"212.232.234.26","source":"redirect","success":true}],"language":"de","paymentMethod":"VIS","refno":"${orderPaymentId}","refno2":"${userId}","status":"authorized","transactionId":"${transactionId}","type":"payment"}`,
    //       },
    //     );

    //     expect(result.status).toBe(200);

    //     const order = await db
    //       .collection('orders')
    //       .findOne({ _id: 'datatrans-order' });
    //     expect(order.status).toBe('CONFIRMED');

    //     const orderPayment = await db
    //       .collection('order_payments')
    //       .findOne({ _id: orderPaymentId });
    //     expect(orderPayment.status).toBe('PAID');
    //   });
    // });
    // describe('Checkout', () => {
    //   it('checkout with stored alias', async () => {
    //     const { data: { me } = {} } = await graphqlFetch({
    //       query: /* GraphQL */ `
    //         query {
    //           me {
    //             paymentCredentials {
    //               _id
    //               user {
    //                 _id
    //               }
    //               paymentProvider {
    //                 _id
    //               }
    //               meta
    //               token
    //               isValid
    //               isPreferred
    //             }
    //           }
    //         }
    //       `,
    //     });

    //     expect(me?.paymentCredentials?.[0]).toMatchObject({
    //       user: { _id: 'user' },
    //       paymentProvider: { _id: 'datatrans-payment-provider' },
    //       meta: {
    //         info: { masked: '424242xxxxxx4242' },
    //         objectKey: 'card',
    //         paymentMethod: 'VIS',
    //         currency: 'CHF',
    //         language: 'de',
    //         type: 'payment',
    //       },
    //       token: expect.anything(),
    //       isValid: false,
    //       isPreferred: true,
    //     });

    //     const credentials = me?.paymentCredentials?.[0];

    //     const { data: { addCartProduct, updateCart, checkoutCart } = {} } =
    //       await graphqlFetch({
    //         query: /* GraphQL */ `
    //           mutation addAndCheckout($productId: ID!, $paymentContext: JSON) {
    //             emptyCart {
    //               _id
    //             }
    //             addCartProduct(productId: $productId) {
    //               _id
    //             }
    //             updateCart(paymentProviderId: "datatrans-payment-provider") {
    //               _id
    //               status
    //             }
    //             checkoutCart(paymentContext: $paymentContext) {
    //               _id
    //               status
    //             }
    //           }
    //         `,
    //         variables: {
    //           productId: 'simpleproduct',
    //           paymentContext: {
    //             paymentCredentials: credentials,
    //           },
    //         },
    //       });
    //     expect(addCartProduct).toMatchObject(expect.anything());
    //     expect(updateCart).toMatchObject({
    //       status: 'OPEN',
    //     });
    //     expect(checkoutCart).toMatchObject({
    //       status: 'CONFIRMED',
    //     });
    //   });
    //   it('checkout with preferred alias', async () => {
    //     const { data: { addCartProduct, updateCart, checkoutCart } = {} } =
    //       await graphqlFetch({
    //         query: /* GraphQL */ `
    //           mutation addAndCheckout($productId: ID!) {
    //             addCartProduct(productId: $productId) {
    //               _id
    //             }
    //             updateCart(paymentProviderId: "datatrans-payment-provider") {
    //               _id
    //               status
    //             }
    //             checkoutCart {
    //               _id
    //               status
    //             }
    //           }
    //         `,
    //         variables: {
    //           productId: 'simpleproduct',
    //         },
    //       });
    //     expect(addCartProduct).toMatchObject(expect.anything());
    //     expect(updateCart).toMatchObject({
    //       status: 'OPEN',
    //     });
    //     expect(checkoutCart).toMatchObject({
    //       status: 'CONFIRMED',
    //     });
    //   });
    // });
  });
}
