import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isACPAdapterKeyAllowed, isACPHandlerAccepted } from './config.ts';

describe('ACP payment layer is adapter-agnostic (logic)', () => {
  it('accepts arbitrary non-Stripe adapter keys from the allowlist', () => {
    const allowed = ['com.acme.payment.adyen', 'org.example.paypal'];
    assert.equal(isACPAdapterKeyAllowed('com.acme.payment.adyen', allowed), true);
    assert.equal(isACPAdapterKeyAllowed('org.example.paypal', allowed), true);
    assert.equal(isACPAdapterKeyAllowed('shop.unchained.payment.stripe', allowed), false);
    assert.equal(isACPAdapterKeyAllowed(undefined, allowed), false);
  });

  it('accepts arbitrary non-Stripe payment handler ids', () => {
    const accepted = ['adyen_token', 'paypal_wallet'];
    assert.equal(isACPHandlerAccepted('adyen_token', accepted), true);
    assert.equal(isACPHandlerAccepted('paypal_wallet', accepted), true);
    assert.equal(isACPHandlerAccepted('stripe_spt', accepted), false);
  });
});
