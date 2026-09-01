import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isAcpAdapterKeyAllowed, isAcpHandlerAccepted } from './config.ts';

describe('ACP payment layer is adapter-agnostic (logic)', () => {
  it('accepts arbitrary non-Stripe adapter keys from the allowlist', () => {
    const allowed = ['com.acme.payment.adyen', 'org.example.paypal'];
    assert.equal(isAcpAdapterKeyAllowed('com.acme.payment.adyen', allowed), true);
    assert.equal(isAcpAdapterKeyAllowed('org.example.paypal', allowed), true);
    // no implicit Stripe fallback — an adapter not on the allowlist is rejected
    assert.equal(isAcpAdapterKeyAllowed('shop.unchained.payment.stripe', allowed), false);
    assert.equal(isAcpAdapterKeyAllowed(undefined, allowed), false);
  });

  it('accepts arbitrary non-Stripe payment handler ids', () => {
    const accepted = ['adyen_token', 'paypal_wallet'];
    assert.equal(isAcpHandlerAccepted('adyen_token', accepted), true);
    assert.equal(isAcpHandlerAccepted('paypal_wallet', accepted), true);
    assert.equal(isAcpHandlerAccepted('stripe_spt', accepted), false);
  });
});
