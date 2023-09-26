import { createLoggedInGraphqlFetch, setupDatabase } from './helpers';
import { USER_TOKEN } from './seeds/users';
import { SimplePaymentProvider } from './seeds/payments';
import { SimpleOrder, SimplePosition, SimplePayment } from './seeds/orders';
import { SuccTranscationHookPayload, SuccTransactionApiResponse } from './seeds/postfinance-checkout';
import { orderIsPaid } from '../packages/plugins/lib/payment/postfinance-checkout/utils';

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

    describe('Payment Flow with Webhook Call (PostFinance Checkout) should', () => {
      const mockedOrderModule = {
        payments: {
          findOrderPayment: ({ orderPaymentId }) => { return orderPaymentId === 'pfcheckout-payment' ? { orderId: 'pfcheckout-order' } : {} },
          markAsPaid: jest.fn(),
        },
        findOrder: ({ orderId }) => { return orderId === 'pfcheckout-order' ? { orderId, currency: SimpleOrder.currency } : {} },
        pricingSheet: ({ orderId }) => {
          if (orderId === 'pfcheckout-order') {
            return {
              total: () => ({
                amount: 32145
              })
            }
          }
          return {}
        }
      }

      it('starts a new transaction with webhook call and no payment', async () => {
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

        // Simulate WebHook call
        const result = await fetch(
          'http://localhost:4010/payment/postfinance-checkout',
          {
            method: 'POST',
            duplex: 'half',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...SuccTranscationHookPayload,
              entityId: transactionId,
              spaceId: PFCHECKOUT_SPACE_ID,
            }),
          },
        );
        expect(result.status).toBe(200);
        expect(await result.text()).toBe(`Order not marked as paid`);
        expect(mockedOrderModule.payments.markAsPaid.mock.calls.length).toBe(0);
      }, 10000);

      it('starts a new transaction with webhook call and payment', async () => {
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

        const transactionRes = {
          ...SuccTransactionApiResponse,
          metaData: { orderPaymentId: 'pfcheckout-payment' },
        }

        // Call function that is called by webhook with modified transaction to mock response
        const hookRes = await orderIsPaid(transactionRes, mockedOrderModule);
        expect(hookRes).toBe(true);
      }, 10000);

      it('starts a new transaction with webhook call and too low payment', async () => {
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

        const transactionRes = {
          ...SuccTransactionApiResponse,
          metaData: { orderPaymentId: 'pfcheckout-payment' },
          authorizationAmount: 200.00,
          completedAmount: 200.00,
        }

        // Call function that is called by webhook with modified transaction to mock response
        const hookRes = await orderIsPaid(transactionRes, mockedOrderModule);
        expect(hookRes).toBe(false);
      }, 10000);


    });

    describe('Payment Flow with lost WebHook call (PostFinance Checkout) should', () => {
      it('starts a new transaction and calls checkoutCart without payment', async () => {
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

        const {
          data: { checkoutCart },
        } = await graphqlFetch({
          query: /* GraphQL */ `
          mutation checkoutCart(
            $orderId: ID!
          ) {
            checkoutCart( orderId: $orderId ) {
                _id
            }
          }
        `,
          variables: {
            orderId: 'pfcheckout-order',
          },
        });
        const orderPayment = await db.collection("order_payments").findOne({ _id: "pfcheckout-payment" });
        expect(orderPayment.status).not.toBe("PAID");
      }, 10000);

      // Succesful case not tested here, charge calls same function (orderIsPaid) as webhook call

    });
  });
} else {
  describe.skip('Plugins: Postfinance Checkout Payments', () => {
    it('Skipped because secret not set', async () => {
      console.log('skipped'); // eslint-disable-line
    });
  });
}
