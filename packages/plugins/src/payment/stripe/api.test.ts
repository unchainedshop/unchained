import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import type StripeClient from 'stripe';
import type { UnchainedCore } from '@unchainedshop/core';
import { createStripeWebhookHandler } from './api.ts';

describe('Stripe webhook handler', () => {
  it('verifies the raw body and processes a payment intent through core services', async () => {
    const event = {
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_1',
          metadata: { environment: 'test', orderPaymentId: 'payment-1' },
        },
      },
    };
    const constructEvent = mock.fn(() => event);
    const logEvent = mock.fn();
    const findOrderPayment = mock.fn(async () => ({ _id: 'payment-1', orderId: 'order-1' }));
    const checkoutOrder = mock.fn(async () => ({ _id: 'order-1' }));
    const handler = createStripeWebhookHandler({
      stripeClient: { webhooks: { constructEvent } } as unknown as StripeClient,
      endpointSecret: 'whsec_test',
      environment: 'test',
    });
    const context = {
      modules: { orders: { payments: { logEvent, findOrderPayment } } },
      services: { orders: { checkoutOrder } },
    } as unknown as UnchainedCore;
    const rawBody = JSON.stringify(event);

    const response = await handler(
      new Request('https://example.com/payment/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'signature' },
        body: rawBody,
      }),
      context,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      success: true,
      message: 'checkout successful',
      orderId: 'order-1',
    });
    assert.deepEqual(constructEvent.mock.calls[0].arguments, [rawBody, 'signature', 'whsec_test']);
    assert.deepEqual(findOrderPayment.mock.calls[0].arguments, [{ orderPaymentId: 'payment-1' }]);
    assert.deepEqual(logEvent.mock.calls[0].arguments, ['payment-1', event]);
    assert.deepEqual(checkoutOrder.mock.calls[0].arguments, [
      'order-1',
      { paymentContext: { paymentIntentId: 'pi_1' } },
    ]);
  });
});
