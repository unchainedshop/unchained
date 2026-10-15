import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import type StripeClient from 'stripe';
import {
  createAcpSharedPaymentTokenIntent,
  createOrderPaymentIntent,
  resumeAcpPaymentIntent,
  upsertCustomer,
} from './stripe.ts';

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
        statement_descriptor_suffix: 'attacker',
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
    assert.equal(params.description, 'Unchained');
    assert.equal(params.statement_descriptor_suffix, undefined);
    assert.deepEqual(params.metadata, {
      custom: 'preserved',
      orderPaymentId: 'payment-1',
      orderId: 'order-12345678',
      userId: 'user-1',
      environment: '',
    });
  });

  it('charges every shared payment token under its own idempotency key and reports declines', async () => {
    const create = mock.fn(async () => {
      throw Object.assign(new Error('Your card was declined.'), { type: 'StripeCardError' });
    });

    await assert.rejects(
      createAcpSharedPaymentTokenIntent(
        {
          acpToken: 'spt_declined',
          order: { _id: 'order-12345678', currencyCode: 'CHF' } as any,
          orderPayment: { _id: 'payment-1' } as any,
          pricing: { total: () => ({ amount: 1000, currencyCode: 'CHF' }) } as any,
        },
        createClient({ paymentIntents: { create } }),
      ),
      { message: 'Your card was declined.', cause: 'PAYMENT_DECLINED' },
    );
    assert.equal(create.mock.calls[0].arguments[1].idempotencyKey, 'acp-payment-1-spt_declined');
  });

  it('reports a shared payment token Stripe refuses as a decline and passes other errors on', async () => {
    const charge = (error: Error) =>
      createAcpSharedPaymentTokenIntent(
        {
          acpToken: 'spt_used',
          order: { _id: 'order-12345678', currencyCode: 'CHF' } as any,
          orderPayment: { _id: 'payment-1' } as any,
          pricing: { total: () => ({ amount: 1000, currencyCode: 'CHF' }) } as any,
        },
        createClient({
          paymentIntents: {
            create: async () => {
              throw error;
            },
          },
        }),
      );
    const refused =
      'The shared payment granted token cannot be used because it is already in a deactivated state.';

    await assert.rejects(
      charge(Object.assign(new Error(refused), { type: 'StripeInvalidRequestError' })),
      { message: refused, cause: 'PAYMENT_DECLINED' },
    );
    await assert.rejects(
      charge(Object.assign(new Error('Stripe is unavailable'), { type: 'StripeAPIError' })),
      (error: Error) => error.message === 'Stripe is unavailable' && error.cause === undefined,
    );
  });

  it('resumes, confirms or cancels a payment intent that waited for the authentication', async () => {
    const statuses = {
      pi_waiting: 'requires_action',
      pi_confirmable: 'requires_confirmation',
      pi_paid: 'succeeded',
    };
    const calls: string[] = [];
    const paymentIntents = {
      retrieve: async (id: string) => ({ id, status: statuses[id] }),
      confirm: async (id: string) => {
        calls.push(`confirm ${id}`);
        return { id, status: 'succeeded' };
      },
      cancel: async (id: string) => {
        calls.push(`cancel ${id}`);
        return { id, status: 'canceled' };
      },
    };
    const resume = async (paymentIntentId: string, outcome: string) =>
      (
        await resumeAcpPaymentIntent(
          { paymentIntentId, authenticationResult: { outcome } },
          createClient({ paymentIntents }),
        )
      ).status;

    assert.deepEqual(
      [
        await resume('pi_waiting', 'authenticated'),
        await resume('pi_waiting', 'denied'),
        await resume('pi_confirmable', 'authenticated'),
        await resume('pi_paid', 'denied'),
      ],
      ['requires_action', 'canceled', 'succeeded', 'succeeded'],
    );
    assert.deepEqual(calls, ['cancel pi_waiting', 'confirm pi_confirmable']);
  });
});
