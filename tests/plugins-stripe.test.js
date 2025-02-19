import test from 'node:test';
import assert from 'node:assert';
import Stripe from 'stripe';
import { createLoggedInGraphqlFetch, setupDatabase } from './helpers.js';
import { USER_TOKEN } from './seeds/users.js';
import { SimplePaymentProvider } from './seeds/payments.js';
import { SimpleOrder, SimplePosition, SimplePayment } from './seeds/orders.js';

const { STRIPE_SECRET } = process.env;

let db;
let graphqlFetch;

if (STRIPE_SECRET) {
  test.describe('Plugins: Stripe Payments', async () => {
    test.before(async () => {
      [db] = await setupDatabase();
      graphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);

      // Add a stripe provider
      await db.collection('payment-providers').findOrInsertOne({
        ...SimplePaymentProvider,
        _id: 'stripe-payment-provider',
        adapterKey: 'shop.unchained.payment.stripe',
        type: 'GENERIC',
        configuration: [{ key: 'descriptorPrefix', value: 'Book Shop' }],
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

    test.describe('Mutation.signPaymentProviderForCredentialRegistration (Stripe)', async () => {
      let idAndSecret;
      test('Request a new client secret for the purpose of registration', async () => {
        const { data: { signPaymentProviderForCredentialRegistration } = {} } = await graphqlFetch({
          query: /* GraphQL */ `
            mutation signPaymentProviderForCredentialRegistration(
              $paymentProviderId: ID!
              $transactionContext: JSON
            ) {
              signPaymentProviderForCredentialRegistration(
                paymentProviderId: $paymentProviderId
                transactionContext: $transactionContext
              )
            }
          `,
          variables: {
            paymentProviderId: 'stripe-payment-provider',
            transactionContext: {
              payment_method: 'pm_card_visa',
              payment_method_types: ['card'],
            },
          },
        });

        assert.ok(signPaymentProviderForCredentialRegistration);
        assert.notStrictEqual(signPaymentProviderForCredentialRegistration, '');
        assert.notStrictEqual(signPaymentProviderForCredentialRegistration, null);
        assert.notStrictEqual(signPaymentProviderForCredentialRegistration, undefined);
        idAndSecret = signPaymentProviderForCredentialRegistration.split('_secret_');
      });

      test('Confirm the setup intent', async () => {
        const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2024-04-10' });

        const confirmedIntent = await stripe.setupIntents.confirm(idAndSecret[0], {
          return_url: 'http://localhost:4010',
          use_stripe_sdk: true,
          payment_method: 'pm_card_visa',
        });

        assert.deepStrictEqual(confirmedIntent.status, 'succeeded');

        const { data: { registerPaymentCredentials } = {} } = await graphqlFetch({
          query: /* GraphQL */ `
            mutation register($paymentProviderId: ID!, $transactionContext: JSON!) {
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
        assert.deepStrictEqual(registerPaymentCredentials, {
          isValid: true,
          isPreferred: true,
        });
      });

      test('checkout with stored alias', async () => {
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

        assert.partialDeepStrictEqual(credentials, {
          isPreferred: true,
          isValid: true,
          meta: {
            usage: 'off_session',
          },
          paymentProvider: { _id: 'stripe-payment-provider' },
          user: { _id: 'user' },
        });

        const { data } = await graphqlFetch({
          query: /* GraphQL */ `
            mutation addAndCheckout($productId: ID!, $paymentContext: JSON, $paymentProviderId: ID) {
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

        assert.ok(addCartProduct);
        assert.deepStrictEqual(updateCart, {
          status: 'OPEN',
          payment: {
            provider: {
              _id: 'stripe-payment-provider',
            },
          },
        });
        assert.deepStrictEqual(checkoutCart, {
          status: 'CONFIRMED',
        });
      });
    });

    test.describe('Mutation.signPaymentProviderForCheckout (Stripe)', async () => {
      let idAndSecret;
      test('Request a new client secret', async () => {
        const { data: { signPaymentProviderForCheckout } = {} } = await graphqlFetch({
          query: /* GraphQL */ `
            mutation signPaymentProviderForCheckout($transactionContext: JSON, $orderPaymentId: ID!) {
              signPaymentProviderForCheckout(
                orderPaymentId: $orderPaymentId
                transactionContext: $transactionContext
              )
            }
          `,
          variables: {
            orderPaymentId: 'stripe-payment',
            transactionContext: {},
          },
        });

        assert.ok(signPaymentProviderForCheckout);
        assert.notStrictEqual(signPaymentProviderForCheckout, '');
        assert.notStrictEqual(signPaymentProviderForCheckout, null);
        assert.notStrictEqual(signPaymentProviderForCheckout, undefined);
        idAndSecret = signPaymentProviderForCheckout.split('_secret_');
      });

      test('Confirm the payment and checkout the order', async () => {
        const stripe = Stripe(STRIPE_SECRET);

        const confirmedIntent = await stripe.paymentIntents.confirm(idAndSecret[0], {
          return_url: 'http://localhost:4010',
          use_stripe_sdk: true,
          payment_method: 'pm_card_visa',
        });

        assert.deepStrictEqual(confirmedIntent.status, 'succeeded');

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
        assert.deepStrictEqual(checkoutCart, {
          status: 'CONFIRMED',
        });
      });
    });
  });
} else {
  test.skip('Plugins: Stripe Payments', () => {
    console.log('skipped'); // eslint-disable-line
  });
}
