import { describe, it } from 'node:test';
import assert from 'node:assert';

// Runs in its own test-runner process (default per-file isolation), so setting env
// before the first (dynamic) import of config.ts evaluates it fresh. Proves the ACP
// payment layer is driven entirely by configuration — a non-Stripe PSP configured via
// env is accepted, and Stripe receives NO special treatment.
describe('ACP config is env-driven, not Stripe-hardcoded', () => {
  it('adopts a non-Stripe adapter + handler configured purely via env', async () => {
    process.env.ACP_PAYMENT_ADAPTER_KEYS = 'com.acme.payment.adyen,org.example.paypal';
    process.env.ACP_PAYMENT_HANDLER_ID = 'adyen_token';
    process.env.ACP_PAYMENT_HANDLER_PSP = 'adyen';
    process.env.ACP_PAYMENT_HANDLER_DISPLAY_NAME = 'Adyen Card';

    const { acpConfig, acpPaymentAdapterKeys, isAcpAdapterKeyAllowed, isAcpHandlerAccepted } =
      await import('./config.ts');

    // the configured non-Stripe adapters are the allowlist
    assert.deepEqual(acpPaymentAdapterKeys, ['com.acme.payment.adyen', 'org.example.paypal']);
    assert.equal(isAcpAdapterKeyAllowed('com.acme.payment.adyen'), true);
    assert.equal(isAcpAdapterKeyAllowed('org.example.paypal'), true);
    // Stripe is NOT privileged: when it is not configured, it is not allowed
    assert.equal(isAcpAdapterKeyAllowed('shop.unchained.payment.stripe'), false);

    // the advertised handler + accepted handler_id follow the env, not a hardcoded stripe value
    assert.equal(acpConfig.paymentHandler.id, 'adyen_token');
    assert.equal(acpConfig.paymentHandler.psp, 'adyen');
    assert.equal(acpConfig.paymentHandler.display_name, 'Adyen Card');
    assert.equal(isAcpHandlerAccepted('adyen_token'), true);
  });
});
