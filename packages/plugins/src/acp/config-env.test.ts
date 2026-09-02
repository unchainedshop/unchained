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
    process.env.ACP_PAYMENT_MERCHANT_ID = 'merchant-adyen';
    process.env.UNCHAINED_ACP_API_KEY = 'test-api-key';
    process.env.UNCHAINED_ACP_PAYMENT_PROVIDER_ID = 'payment-provider-id';
    process.env.ACP_CHECKOUT_CONTINUE_URL = 'https://shop.example.test/checkout';
    process.env.ROOT_URL = 'https://initial.example.test';

    const {
      acpConfig,
      acpPaymentAdapterKeys,
      getACPApiBaseUrl,
      getACPConfigurationErrors,
      isAcpAdapterKeyAllowed,
      isAcpHandlerAccepted,
    } = await import('./config.ts');

    assert.deepEqual(acpPaymentAdapterKeys, ['com.acme.payment.adyen', 'org.example.paypal']);
    assert.equal(isAcpAdapterKeyAllowed('com.acme.payment.adyen'), true);
    assert.equal(isAcpAdapterKeyAllowed('org.example.paypal'), true);
    // Stripe is NOT privileged: when it is not configured, it is not allowed
    assert.equal(isAcpAdapterKeyAllowed('shop.unchained.payment.stripe'), false);

    assert.equal(acpConfig.paymentHandler.id, 'adyen_token');
    assert.equal(acpConfig.paymentHandler.psp, 'adyen');
    assert.equal(acpConfig.paymentHandler.display_name, 'Adyen Card');
    assert.equal(acpConfig.paymentHandler.config.merchant_id, 'merchant-adyen');
    assert.equal(acpConfig.paymentHandler.config.psp, 'adyen');
    assert.equal(isAcpHandlerAccepted('adyen_token'), true);
    assert.equal(isAcpHandlerAccepted('stripe_spt'), false);
    assert.deepEqual(getACPConfigurationErrors(), []);

    process.env.ROOT_URL = 'https://runtime.example.test';
    assert.equal(getACPApiBaseUrl(), 'https://runtime.example.test/acp');
    assert.equal(
      acpConfig.paymentHandler.config_schema,
      'https://runtime.example.test/.well-known/acp/schemas/payment-handler-config.json',
    );

    process.env.ROOT_URL = 'not-an-absolute-url';
    assert.ok(getACPConfigurationErrors().some((error) => error.includes('absolute')));
  });
});
