import test from 'node:test';
import assert from 'node:assert';
import {
  assertPaymentIntentMatchesOrderPayment,
  buildOrderPaymentMetadata,
  buildStatementDescriptorSuffix,
  resolveStripePaymentTotal,
} from './metadata.ts';

const pricing = {
  total: () => ({ amount: 1234.4, currencyCode: 'CHF' }),
} as any;

const order = {
  _id: 'order-123456789',
  userId: 'user',
} as any;

const orderPayment = {
  _id: 'payment-123',
} as any;

test.describe('Stripe metadata helpers', () => {
  test('builds order payment metadata in one shape', () => {
    assert.deepStrictEqual(buildOrderPaymentMetadata({ order, orderPayment }), {
      orderPaymentId: 'payment-123',
      orderId: 'order-123456789',
      userId: 'user',
      environment: process.env.STRIPE_WEBHOOK_ENVIRONMENT ?? null,
    });
  });

  test('builds statement descriptor suffix and rounded total', () => {
    assert.strictEqual(buildStatementDescriptorSuffix(order._id), 'orde..6789');
    assert.deepStrictEqual(resolveStripePaymentTotal(pricing), {
      amount: 1234,
      currency: 'chf',
    });
  });

  test('validates matching payment intents', () => {
    assert.doesNotThrow(() =>
      assertPaymentIntentMatchesOrderPayment({
        paymentIntent: {
          amount: 1234,
          currency: 'chf',
          metadata: { orderPaymentId: 'payment-123' },
        } as any,
        orderPayment,
        pricing,
      }),
    );
  });

  test('rejects amount, currency, and order payment mismatches', () => {
    assert.throws(
      () =>
        assertPaymentIntentMatchesOrderPayment({
          paymentIntent: {
            amount: 1235,
            currency: 'chf',
            metadata: { orderPaymentId: 'payment-123' },
          } as any,
          orderPayment,
          pricing,
        }),
      /price has changed/,
    );

    assert.throws(
      () =>
        assertPaymentIntentMatchesOrderPayment({
          paymentIntent: {
            amount: 1234,
            currency: 'eur',
            metadata: { orderPaymentId: 'payment-123' },
          } as any,
          orderPayment,
          pricing,
        }),
      /price has changed/,
    );

    assert.throws(
      () =>
        assertPaymentIntentMatchesOrderPayment({
          paymentIntent: {
            amount: 1234,
            currency: 'chf',
            metadata: { orderPaymentId: 'other-payment' },
          } as any,
          orderPayment,
          pricing,
        }),
      /order payment is different/,
    );
  });
});
