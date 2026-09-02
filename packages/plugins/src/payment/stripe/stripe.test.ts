import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import type StripeClient from 'stripe';
import { createOrderPaymentIntent, upsertCustomer } from './stripe.ts';

const createClient = ({
  customers = {},
  paymentIntents = {},
}: {
  customers?: Record<string, unknown>;
  paymentIntents?: Record<string, unknown>;
} = {}) =>
  ({
    customers,
    paymentIntents,
  }) as unknown as StripeClient;

describe('Stripe gateway', () => {
  it('propagates customer search failures instead of creating duplicates', async () => {
    const searchError = new Error('Stripe search unavailable');
    const create = mock.fn();
    const stripeClient = createClient({
      customers: {
        search: mock.fn(async () => {
          throw searchError;
        }),
        create,
      },
    });

    await assert.rejects(
      upsertCustomer({ userId: 'user-1', name: 'Ada', email: 'ada@example.com' }, stripeClient),
      searchError,
    );
    assert.equal(create.mock.callCount(), 0);
  });

  it('keeps order payment invariants authoritative over transaction context', async () => {
    const create = mock.fn(async (params) => ({ id: 'pi_test', ...params }));
    const stripeClient = createClient({
      customers: {
        search: mock.fn(async () => ({
          data: [
            {
              id: 'cus_expected',
              name: 'Ada',
              email: 'ada@example.com',
              metadata: {},
            },
          ],
        })),
        update: mock.fn(),
        create: mock.fn(),
      },
      paymentIntents: { create },
    });

    await createOrderPaymentIntent(
      {
        userId: 'user-1',
        name: 'Ada',
        email: 'ada@example.com',
        order: {
          _id: 'order-12345678',
          currencyCode: 'CHF',
          contact: { emailAddress: 'buyer@example.com' },
        } as any,
        orderPayment: { _id: 'payment-1' } as any,
        pricing: {
          total: () => ({ amount: 1234.4, currencyCode: 'CHF' }),
        } as any,
        descriptorPrefix: 'Unchained',
      },
      {
        amount: 1,
        currency: 'usd',
        customer: 'cus_untrusted',
        receipt_email: 'attacker@example.com',
        metadata: {
          orderId: 'other-order',
          orderPaymentId: 'other-payment',
          custom: 'preserved',
        },
        payment_method: 'pm_card_visa',
      },
      stripeClient,
    );

    const [params] = create.mock.calls[0].arguments;
    assert.equal(params.amount, 1234);
    assert.equal(params.currency, 'chf');
    assert.equal(params.customer, 'cus_expected');
    assert.equal(params.receipt_email, 'buyer@example.com');
    assert.equal(params.payment_method, 'pm_card_visa');
    assert.deepEqual(params.metadata, {
      custom: 'preserved',
      orderPaymentId: 'payment-1',
      orderId: 'order-12345678',
      userId: 'user-1',
      environment: '',
    });
  });
});
