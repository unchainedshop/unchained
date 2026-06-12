import test from 'node:test';
import assert from 'node:assert';
import { normalizeStripeChargeRequest } from './charge-request.ts';

test.describe('normalizeStripeChargeRequest', () => {
  test('chooses ACP SPT over injected credentials and payment intents', () => {
    assert.deepStrictEqual(
      normalizeStripeChargeRequest({
        acpToken: 'spt_123',
        acpHandlerId: 'stripe_spt',
        paymentIntentId: 'pi_123',
        paymentCredentials: { token: 'pm_123' },
      }),
      {
        mode: 'acp-spt',
        acpToken: 'spt_123',
        acpHandlerId: 'stripe_spt',
      },
    );
  });

  test('chooses payment intent over injected credentials', () => {
    assert.deepStrictEqual(
      normalizeStripeChargeRequest({
        paymentIntentId: 'pi_123',
        paymentCredentials: { token: 'pm_123' },
      }),
      {
        mode: 'payment-intent',
        paymentIntentId: 'pi_123',
      },
    );
  });

  test('chooses stored credentials when no higher priority mode is present', () => {
    const paymentCredentials = { token: 'pm_123', meta: { customer: 'cus_123' } };

    assert.deepStrictEqual(normalizeStripeChargeRequest({ paymentCredentials }), {
      mode: 'stored-credential',
      paymentCredentials,
    });
  });

  test('rejects invalid ACP tokens instead of falling through to credentials', () => {
    assert.throws(
      () =>
        normalizeStripeChargeRequest({
          acpToken: '',
          paymentCredentials: { token: 'pm_123' },
        }),
      /non-empty acpToken/,
    );
  });

  test('rejects missing usable charge input', () => {
    assert.throws(
      () => normalizeStripeChargeRequest({ paymentCredentials: {} }),
      /paymentCredentials with a token/,
    );
    assert.throws(
      () => normalizeStripeChargeRequest({}),
      /acpToken, paymentIntentId or paymentCredentials/,
    );
  });
});
