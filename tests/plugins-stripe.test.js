import test from 'node:test';
import assert from 'node:assert';
import Stripe from 'stripe';
import { createLoggedInGraphqlFetch, disconnect, setupDatabase } from './helpers.js';
import { USER_TOKEN } from './seeds/users.js';
import { SimplePaymentProvider } from './seeds/payments.js';
import { SimpleOrder, SimplePosition, SimplePayment } from './seeds/orders.js';

const { STRIPE_SECRET } = process.env;

let db;
let graphqlFetch;

test.describe('Plugins: Stripe Payments', async () => {
  if (STRIPE_SECRET) {
    test.before(async () => {
      [db] = await setupDatabase();
      graphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);

      await db.collection('payment-providers').findOrInsertOne({
        ...SimplePaymentProvider,
        _id: 'stripe-payment-provider',
        adapterKey: 'shop.unchained.payment.stripe',
        type: 'GENERIC',
        configuration: [{ key: 'descriptorPrefix', value: 'Book Shop' }],
      });

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
        calculation: [
          {
            category: 'ITEMS',
            amount: 32145,
          },
          { category: 'TAXES', amount: 0 },
          {
            category: 'PAYMENT',
            amount: 0,
          },
          {
            category: 'DELIVERY',
            amount: 0,
          },
          {
            category: 'DISCOUNTS',
            amount: 0,
          },
        ],
      });
    });

    test.after(async () => {
      await disconnect();
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

      test('Confirm the payment intent', async () => {
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
                transactionContext: $transactionContext
                paymentProviderId: $paymentProviderId
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

        assert.partialDeepStrictEqual(registerPaymentCredentials, {
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
        assert.partialDeepStrictEqual(updateCart, {
          _id: 'simple-order',
          status: 'OPEN',
          payment: {
            provider: {
              _id: 'stripe-payment-provider',
            },
          },
        });
        assert.partialDeepStrictEqual(checkoutCart, {
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
          _id: 'stripe-order',
          status: 'CONFIRMED',
        });
      });
    });

    test.describe('POST /payment/stripe (Webhook)', async () => {
      let stripe;
      test.before(() => {
        stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2024-04-10' });
      });

      test('Handle payment_intent.succeeded webhook event successfully', async () => {
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
            orderPaymentId: 'stripe-payment2',
            transactionContext: {},
          },
        });

        const idAndSecret = signPaymentProviderForCheckout.split('_secret_');

        const paymentIntent = await stripe.paymentIntents.confirm(idAndSecret[0], {
          return_url: 'http://localhost:4010',
          payment_method: 'pm_card_visa',
        });

        const webhookEvent = {
          id: `evt_test_${Date.now()}`,
          object: 'event',
          type: 'payment_intent.succeeded',
          data: {
            object: paymentIntent,
          },
        };

        const webhookSecret = process.env.STRIPE_ENDPOINT_SECRET;
        const timestamp = Math.floor(Date.now() / 1000);
        const payload = JSON.stringify(webhookEvent);
        const signature = stripe.webhooks.generateTestHeaderString({
          payload,
          secret: webhookSecret,
          timestamp,
        });

        const response = await fetch('http://localhost:4010/payment/stripe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': signature,
          },
          body: payload,
        });

        const result = await response.json();
        assert.strictEqual(response.status, 200);
        assert.ok(result.message || result.orderId);
        assert.strictEqual(result.orderId, 'stripe-order2');

        const { data: { order } = {} } = await graphqlFetch({
          query: /* GraphQL */ `
            query getOrder($orderId: ID!) {
              order(orderId: $orderId) {
                _id
                status
              }
            }
          `,
          variables: {
            orderId: 'stripe-order2',
          },
        });

        assert.strictEqual(order.status, 'CONFIRMED');
      });

      test('Return 400 when stripe-signature header is missing', async () => {
        const webhookEvent = {
          id: 'evt_test',
          type: 'payment_intent.succeeded',
          data: {
            object: {},
          },
        };

        const response = await fetch('http://localhost:4010/payment/stripe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookEvent),
        });

        const result = await response.json();

        assert.strictEqual(response.status, 400);
        assert.ok(result.message.includes('stripe-signature'));
      });

      test('Return 400 when webhook signature is invalid', async () => {
        const webhookEvent = {
          id: 'evt_test',
          type: 'payment_intent.succeeded',
          data: {
            object: {},
          },
        };

        const response = await fetch('http://localhost:4010/payment/stripe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': 'invalid_signature',
          },
          body: JSON.stringify(webhookEvent),
        });

        const result = await response.json();

        assert.strictEqual(response.status, 400);
        assert.ok(result.message);
      });

      test('Return 200 with ignored flag for unsupported event type', async () => {
        const webhookEvent = {
          id: `evt_test_${Date.now()}`,
          object: 'event',
          type: 'customer.created',
          data: {
            object: {
              id: 'cus_test',
              metadata: {
                environment: process.env.STRIPE_WEBHOOK_ENVIRONMENT || '',
              },
            },
          },
        };

        const webhookSecret = process.env.STRIPE_ENDPOINT_SECRET;
        const timestamp = Math.floor(Date.now() / 1000);
        const payload = JSON.stringify(webhookEvent);
        const signature = stripe.webhooks.generateTestHeaderString({
          payload,
          secret: webhookSecret,
          timestamp,
        });

        const response = await fetch('http://localhost:4010/payment/stripe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': signature,
          },
          body: payload,
        });

        const result = await response.json();

        assert.strictEqual(response.status, 200);
        assert.strictEqual(result.ignored, true);
        assert.ok(result.message.includes('Unhandled event type'));
      });

      test('Return 200 with ignored flag for mismatched environment', async () => {
        const webhookEvent = {
          id: `evt_test_${Date.now()}`,
          object: 'event',
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: 'pi_test',
              metadata: {
                environment: 'different_environment',
              },
            },
          },
        };

        const webhookSecret = process.env.STRIPE_ENDPOINT_SECRET;
        const timestamp = Math.floor(Date.now() / 1000);
        const payload = JSON.stringify(webhookEvent);
        const signature = stripe.webhooks.generateTestHeaderString({
          payload,
          secret: webhookSecret,
          timestamp,
        });

        const response = await fetch('http://localhost:4010/payment/stripe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': signature,
          },
          body: payload,
        });

        const result = await response.json();

        assert.strictEqual(response.status, 200);
        assert.strictEqual(result.ignored, true);
        assert.ok(result.message.includes('Unhandled event environment'));
      });

      test('Return 500 when orderPayment not found for payment_intent.succeeded', async () => {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 10000,
          currency: 'chf',
          payment_method: 'pm_card_visa',
          confirm: true,
          metadata: {
            orderPaymentId: 'non-existent-payment',
            orderId: 'non-existent-order',
            userId: 'user',
            environment: process.env.STRIPE_WEBHOOK_ENVIRONMENT || '',
          },
          return_url: 'http://localhost:4010',
          use_stripe_sdk: true,
        });

        const webhookEvent = {
          id: `evt_test_${Date.now()}`,
          object: 'event',
          type: 'payment_intent.succeeded',
          data: {
            object: paymentIntent,
          },
        };

        const webhookSecret = process.env.STRIPE_ENDPOINT_SECRET;
        const timestamp = Math.floor(Date.now() / 1000);
        const payload = JSON.stringify(webhookEvent);
        const signature = stripe.webhooks.generateTestHeaderString({
          payload,
          secret: webhookSecret,
          timestamp,
        });

        const response = await fetch('http://localhost:4010/payment/stripe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': signature,
          },
          body: payload,
        });

        const result = await response.json();

        assert.strictEqual(response.status, 500);
        assert.ok(result.message.includes('order payment not found'));
      });
    });
  } else {
    test('Secret not set', () => {
      /* */
    });
  }
});
