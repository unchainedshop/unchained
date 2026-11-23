import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import type StripeClient from 'stripe';
import type { UnchainedCore } from '@unchainedshop/core';
import { createStripeWebhookHandler } from './api.ts';

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

const deliverPaymentIntentSucceeded = async (orderAfterCheckout: { _id: string; status: string }) => {
  const constructEvent = mock.fn(() => event);
  const logEvent = mock.fn();
  const findOrderPayment = mock.fn(async () => ({ _id: 'payment-1', orderId: 'order-1' }));
  const checkoutOrder = mock.fn(async () => orderAfterCheckout);
  const processOrder = mock.fn(async () => ({ ...orderAfterCheckout, status: 'CONFIRMED' }));
  const handler = createStripeWebhookHandler({
    stripeClient: { webhooks: { constructEvent } } as unknown as StripeClient,
    endpointSecret: 'whsec_test',
    environment: 'test',
  });
  const context = {
    modules: { orders: { payments: { logEvent, findOrderPayment } } },
    services: { orders: { checkoutOrder, processOrder } },
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
  return { response, rawBody, constructEvent, logEvent, findOrderPayment, checkoutOrder, processOrder };
};

describe('Stripe webhook handler', () => {
  it('verifies the raw body and processes a payment intent through core services', async () => {
    const {
      response,
      rawBody,
      constructEvent,
      logEvent,
      findOrderPayment,
      checkoutOrder,
      processOrder,
    } = await deliverPaymentIntentSucceeded({ _id: 'order-1', status: 'CONFIRMED' });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      success: true,
      message: 'checkout successful',
      orderId: 'order-1',
    });
    assert.deepEqual(constructEvent.mock.calls[0].arguments, [rawBody, 'signature', 'whsec_test']);
    assert.deepEqual(findOrderPayment.mock.calls[0].arguments, [{ orderPaymentId: 'payment-1' }]);
    assert.deepEqual(logEvent.mock.calls[0].arguments, [
      'payment-1',
      { id: event.id, type: event.type },
    ]);
    assert.deepEqual(checkoutOrder.mock.calls[0].arguments, [
      'order-1',
      { paymentContext: { paymentIntentId: 'pi_1' } },
    ]);
    assert.equal(processOrder.mock.callCount(), 0);
  });

  it('processes an order that waits for its payment', async () => {
    const pendingOrder = { _id: 'order-1', status: 'PENDING' };
    const { response, processOrder } = await deliverPaymentIntentSucceeded(pendingOrder);

    assert.equal(response.status, 200);
    assert.deepEqual(processOrder.mock.calls[0].arguments, [
      pendingOrder,
      { paymentContext: { paymentIntentId: 'pi_1' } },
    ]);
  });
});
