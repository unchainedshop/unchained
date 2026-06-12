import test from 'node:test';
import assert from 'node:assert';
import { handleStripeWebhook, WebhookEventTypes } from './webhook.ts';

const createContext = () => {
  const calls: any[] = [];
  const context = {
    modules: {
      orders: {
        payments: {
          logEvent: async (...args: any[]) => calls.push(['logEvent', ...args]),
          findOrderPayment: async ({ orderPaymentId }) => {
            calls.push(['findOrderPayment', orderPaymentId]);
            if (orderPaymentId === 'missing-payment') return null;
            return { _id: orderPaymentId, orderId: 'order-123' };
          },
        },
      },
    },
    services: {
      orders: {
        checkoutOrder: async (...args: any[]) => {
          calls.push(['checkoutOrder', ...args]);
          return { _id: 'order-123' };
        },
        registerPaymentCredentials: async (...args: any[]) => {
          calls.push(['registerPaymentCredentials', ...args]);
          return { _id: 'credentials-123' };
        },
      },
    },
  } as any;

  return { context, calls };
};

const createStripeClient = (event: any) =>
  ({
    webhooks: {
      constructEvent: () => event,
    },
  }) as any;

const env = process.env.STRIPE_WEBHOOK_ENVIRONMENT || '';

test.describe('handleStripeWebhook', () => {
  test('returns 400 when signature is missing', async () => {
    const { context } = createContext();

    const result = await handleStripeWebhook({
      rawBody: '{}',
      context,
      endpointSecret: 'secret',
      stripeClient: createStripeClient({}),
    });

    assert.strictEqual(result.statusCode, 400);
    assert.partialDeepStrictEqual(result.body, {
      success: false,
      name: 'Error',
    });
  });

  test('ignores unsupported event types', async () => {
    const { context } = createContext();

    const result = await handleStripeWebhook({
      rawBody: '{}',
      signature: 'sig',
      context,
      endpointSecret: 'secret',
      stripeClient: createStripeClient({
        type: 'customer.created',
        data: { object: { metadata: { environment: env } } },
      }),
    });

    assert.strictEqual(result.statusCode, 200);
    assert.partialDeepStrictEqual(result.body, {
      success: false,
      ignored: true,
      name: 'UNHANDLED_EVENT_TYPE',
    });
  });

  test('ignores events for a different environment', async () => {
    const { context } = createContext();

    const result = await handleStripeWebhook({
      rawBody: '{}',
      signature: 'sig',
      context,
      endpointSecret: 'secret',
      stripeClient: createStripeClient({
        type: WebhookEventTypes.PAYMENT_INTENT_SUCCEEDED,
        data: { object: { metadata: { environment: 'other-env' } } },
      }),
    });

    assert.strictEqual(result.statusCode, 200);
    assert.partialDeepStrictEqual(result.body, {
      success: false,
      ignored: true,
      name: 'UNHANDLED_EVENT_ENVIRONMENT',
    });
  });

  test('checks out orders for successful payment intents', async () => {
    const { context, calls } = createContext();

    const result = await handleStripeWebhook({
      rawBody: '{}',
      signature: 'sig',
      context,
      endpointSecret: 'secret',
      stripeClient: createStripeClient({
        type: WebhookEventTypes.PAYMENT_INTENT_SUCCEEDED,
        data: {
          object: {
            id: 'pi_123',
            metadata: { environment: env, orderPaymentId: 'payment-123' },
          },
        },
      }),
    });

    assert.strictEqual(result.statusCode, 200);
    assert.partialDeepStrictEqual(result.body, {
      success: true,
      message: 'checkout successful',
      orderId: 'order-123',
    });
    assert.deepStrictEqual(calls[1], ['findOrderPayment', 'payment-123']);
    assert.deepStrictEqual(calls[2], [
      'checkoutOrder',
      'order-123',
      { paymentContext: { paymentIntentId: 'pi_123' } },
    ]);
  });

  test('registers credentials for successful setup intents', async () => {
    const { context, calls } = createContext();

    const result = await handleStripeWebhook({
      rawBody: '{}',
      signature: 'sig',
      context,
      endpointSecret: 'secret',
      stripeClient: createStripeClient({
        type: WebhookEventTypes.SETUP_INTENT_SUCCEEDED,
        data: {
          object: {
            id: 'seti_123',
            metadata: {
              environment: env,
              paymentProviderId: 'provider-123',
              userId: 'user-123',
            },
          },
        },
      }),
    });

    assert.strictEqual(result.statusCode, 200);
    assert.partialDeepStrictEqual(result.body, {
      success: true,
      message: 'payment credentials registration successful',
      paymentCredentialsId: 'credentials-123',
    });
    assert.deepStrictEqual(calls[0], [
      'registerPaymentCredentials',
      'provider-123',
      {
        transactionContext: { setupIntentId: 'seti_123' },
        userId: 'user-123',
      },
    ]);
  });

  test('returns 500 for processing failures', async () => {
    const { context } = createContext();

    const result = await handleStripeWebhook({
      rawBody: '{}',
      signature: 'sig',
      context,
      endpointSecret: 'secret',
      stripeClient: createStripeClient({
        type: WebhookEventTypes.PAYMENT_INTENT_SUCCEEDED,
        data: {
          object: {
            id: 'pi_123',
            metadata: { environment: env, orderPaymentId: 'missing-payment' },
          },
        },
      }),
    });

    assert.strictEqual(result.statusCode, 500);
    assert.partialDeepStrictEqual(result.body, {
      success: false,
      name: 'Error',
    });
  });
});
