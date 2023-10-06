import Stripe from 'stripe';
import { createLoggedInGraphqlFetch, setupDatabase } from './helpers';
import { USER_TOKEN } from './seeds/users';
import { SimplePaymentProvider } from './seeds/payments';
import { SimpleOrder, SimplePosition, SimplePayment } from './seeds/orders';

const { STRIPE_SECRET } = process.env;

let db;
let graphqlFetch;

if (STRIPE_SECRET) {
  describe('Plugins: Stripe Payments', () => {
    beforeAll(async () => {
      [db] = await setupDatabase();
      graphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);

      // Add a stripe provider
      await db.collection('payment-providers').findOrInsertOne({
        ...SimplePaymentProvider,
        _id: 'stripe-payment-provider',
        adapterKey: 'shop.unchained.payment.stripe',
        type: 'GENERIC',
      });

      // Add a demo order ready to checkout
      await db.collection('order_payments').findOrInsertOne({
        ...SimplePayment,
        _id: 'stripe-payment',
        paymentProviderId: 'stripe-payment-provider',
        orderId: 'stripe-order',
      });

      await db.collection('order_positions').findOrInsertOne({
        ...SimplePosition,
        _id: 'stripe-order-position',
        orderId: 'stripe-order',
      });

      await db.collection('orders').findOrInsertOne({
        ...SimpleOrder,
        _id: 'stripe-order',
        orderNumber: 'stripe',
        paymentId: 'stripe-payment',
      });

      // Add a second demo order ready to checkout
      await db.collection('order_payments').findOrInsertOne({
        ...SimplePayment,
        _id: 'stripe-payment2',
        paymentProviderId: 'stripe-payment-provider',
        orderId: 'stripe-order2',
      });

      await db.collection('order_positions').findOrInsertOne({
        ...SimplePosition,
        _id: 'stripe-order-position2',
        orderId: 'stripe-order2',
      });

      await db.collection('orders').findOrInsertOne({
        ...SimpleOrder,
        _id: 'stripe-order2',
        orderNumber: 'stripe2',
        paymentId: 'stripe-payment2',
      });
    });

    describe('Mutation.signPaymentProviderForCredentialRegistration (Stripe)', () => {
      let idAndSecret;
      it('Request a new client secret for the purpose of registration', async () => {
        const { data: { signPaymentProviderForCredentialRegistration } = {} } =
          await graphqlFetch({
            query: /* GraphQL */ `
              mutation signPaymentProviderForCredentialRegistration(
                $paymentProviderId: ID!
              ) {
                signPaymentProviderForCredentialRegistration(
                  paymentProviderId: $paymentProviderId
                )
              }
            `,
            variables: {
              paymentProviderId: 'stripe-payment-provider',
            },
          });

        expect(signPaymentProviderForCredentialRegistration).not.toBe('');
        expect(signPaymentProviderForCredentialRegistration).not.toBe(null);
        expect(signPaymentProviderForCredentialRegistration).not.toBe(
          undefined,
        );
        idAndSecret =
          signPaymentProviderForCredentialRegistration.split('_secret_');
      }, 10000);
      it('Confirm the setup intent', async () => {
        const stripe = Stripe(STRIPE_SECRET);
        
        const confirmedIntent = await stripe.setupIntents.confirm(
          idAndSecret[0],
          {
            payment_method: 'pm_card_visa',
          },
        );
        expect(confirmedIntent).toMatchObject({
          status: 'succeeded',
        });

        const { data: { registerPaymentCredentials } = {} } =
          await graphqlFetch({
            query: /* GraphQL */ `
              mutation register(
                $paymentProviderId: ID!
                $transactionContext: JSON!
              ) {
                registerPaymentCredentials(
                  paymentProviderId: $paymentProviderId
                  transactionContext: $transactionContext
                ) {
                  _id
                  token
                  isValid
                  isPreferred
                }
              }
            `,
            variables: {
              paymentProviderId: confirmedIntent.metadata.paymentProviderId,
              transactionContext: {
                setupIntentId: confirmedIntent.id,
              },
            },
          });
        expect(registerPaymentCredentials).toMatchObject({
          isValid: true,
          isPreferred: true,
        });
      }, 10000);

      it('checkout with stored alias', async () => {
        const { data: { me } = {} } = await graphqlFetch({
          query: /* GraphQL */ `
            query {
              me {
                paymentCredentials {
                  _id
                  user {
                    _id
                  }
                  paymentProvider {
                    _id
                  }
                  meta
                  token
                  isValid
                  isPreferred
                }
              }
            }
          `,
        });
        const credentials = me?.paymentCredentials?.[0];

        expect(credentials).toMatchObject({
          isPreferred: true,
          isValid: true,
          meta: {
            customer: expect.anything(),
            usage: 'off_session',
          },
          token: expect.anything(),
          paymentProvider: { _id: 'stripe-payment-provider' },
          user: { _id: 'user' },
        });

        const { data, error } =
          await graphqlFetch({
            query: /* GraphQL */ `
              mutation addAndCheckout(
                $productId: ID!
                $paymentContext: JSON
                $paymentProviderId: ID
              ) {
                addCartProduct(productId: $productId) {
                  _id
                }
                updateCart(paymentProviderId: $paymentProviderId) {
                  _id
                  status
                  payment {
                    provider {
                      _id
                    }
                  }
                }
                checkoutCart(paymentContext: $paymentContext) {
                  _id
                  status
                }
              }
            `,
            variables: {
              productId: 'simpleproduct',
              paymentProviderId: 'stripe-payment-provider',
              paymentContext: {
                paymentCredentials: credentials,
              },
            },
          });

        const { addCartProduct, updateCart, checkoutCart } = data;

        expect(addCartProduct).toMatchObject(expect.anything());
        expect(updateCart).toMatchObject({
          status: 'OPEN',
          payment: {
            provider: {
              _id: 'stripe-payment-provider',
            },
          },
        });
        expect(checkoutCart).toMatchObject({
          status: 'CONFIRMED',
        });
      }, 10000);
    });

    describe('Mutation.signPaymentProviderForCheckout (Stripe)', () => {
      let idAndSecret;
      it('Request a new client secret', async () => {
        const { data: { signPaymentProviderForCheckout } = {} } = await graphqlFetch({
          query: /* GraphQL */ `
            mutation signPaymentProviderForCheckout($transactionContext: JSON, $orderPaymentId: ID!) {
              signPaymentProviderForCheckout(orderPaymentId: $orderPaymentId, transactionContext: $transactionContext)
            }
          `,
          variables: {
            orderPaymentId: 'stripe-payment',
            transactionContext: {},
          },
        });

        expect(signPaymentProviderForCheckout).not.toBe('');
        expect(signPaymentProviderForCheckout).not.toBe(null);
        expect(signPaymentProviderForCheckout).not.toBe(undefined);
        idAndSecret = signPaymentProviderForCheckout.split('_secret_');
      }, 10000);
      it('Confirm the payment and checkout the order', async () => {
        const stripe = Stripe(STRIPE_SECRET);
        
        const confirmedIntent = await stripe.paymentIntents.confirm(
          idAndSecret[0],
          {
            payment_method: 'pm_card_visa',
          },
        );
        expect(confirmedIntent).toMatchObject({
          status: 'succeeded',
        });

        const { data: { checkoutCart } = {} } = await graphqlFetch({
          query: /* GraphQL */ `
            mutation checkout($orderId: ID, $paymentContext: JSON) {
              checkoutCart(orderId: $orderId, paymentContext: $paymentContext) {
                _id
                status
              }
            }
          `,
          variables: {
            orderId: 'stripe-order',
            paymentContext: {
              paymentIntentId: confirmedIntent.id,
            },
          },
        });
        expect(checkoutCart).toMatchObject({
          status: 'CONFIRMED',
        });
      }, 10000);
    });
  });
} else {
  describe.skip('Plugins: Stripe Payments', () => {
    it('Skipped because secret not set', async () => {
      console.log('skipped'); // eslint-disable-line
    });
  });
}
