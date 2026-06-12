import test from 'node:test';
import assert from 'node:assert';
import {
  createAcpSharedPaymentTokenIntent,
  createStoredCredentialPaymentIntent,
} from './payment-intents.ts';

const order = {
  _id: 'order-123456789',
  userId: 'user',
  contact: { emailAddress: 'customer@example.com' },
} as any;

const orderPayment = {
  _id: 'payment-123',
} as any;

const pricing = {
  total: () => ({ amount: 4200, currencyCode: 'CHF' }),
} as any;

const createFakeStripe = () => {
  const calls: any[] = [];
  return {
    calls,
    client: {
      paymentIntents: {
        create: async (...args: any[]) => {
          calls.push(args);
          return {
            id: 'pi_123',
            status: 'succeeded',
            payment_method: 'pm_123',
          };
        },
      },
    } as any,
  };
};

test.describe('Stripe payment intent helpers', () => {
  test('creates ACP SPT intents with preview-only params and idempotency', async () => {
    const { calls, client } = createFakeStripe();

    await createAcpSharedPaymentTokenIntent(
      {
        acpToken: 'spt_123',
        order,
        orderPayment,
        pricing,
        descriptorPrefix: 'Book Shop',
      },
      client,
    );

    assert.strictEqual(calls.length, 1);
    assert.deepStrictEqual(calls[0][1], {
      apiVersion: '2026-04-22.preview',
      idempotencyKey: 'acp-payment-123',
    });
    assert.partialDeepStrictEqual(calls[0][0], {
      amount: 4200,
      currency: 'chf',
      confirm: true,
      description: 'Book Shop',
      statement_descriptor_suffix: 'orde..6789',
      receipt_email: 'customer@example.com',
      metadata: {
        orderPaymentId: 'payment-123',
        orderId: 'order-123456789',
        userId: 'user',
        environment: process.env.STRIPE_WEBHOOK_ENVIRONMENT ?? null,
      },
      payment_method_data: {
        shared_payment_granted_token: 'spt_123',
      },
    });
  });

  test('creates stored-credential intents using vaulted payment details', async () => {
    const { calls, client } = createFakeStripe();

    await createStoredCredentialPaymentIntent(
      {
        userId: 'user',
        name: 'Customer',
        email: 'customer@example.com',
        order,
        orderPayment,
        pricing,
        descriptorPrefix: 'Book Shop',
        paymentCredentials: {
          token: 'pm_123',
          meta: {
            customer: 'cus_123',
            payment_method_types: ['card'],
          },
        },
      },
      client,
    );

    assert.strictEqual(calls.length, 1);
    assert.partialDeepStrictEqual(calls[0][0], {
      amount: 4200,
      currency: 'chf',
      customer: 'cus_123',
      confirm: true,
      payment_method: 'pm_123',
      payment_method_types: ['card'],
      metadata: {
        orderPaymentId: 'payment-123',
        orderId: 'order-123456789',
        userId: 'user',
        environment: process.env.STRIPE_WEBHOOK_ENVIRONMENT ?? null,
      },
    });
  });
});
