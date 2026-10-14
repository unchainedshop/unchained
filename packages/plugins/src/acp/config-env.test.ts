import { describe, it, type TestContext } from 'node:test';
import assert from 'node:assert';

const importConfigWith = async (t: TestContext, environment: Record<string, string>) => {
  for (const [key, value] of Object.entries(environment)) {
    const original = process.env[key];
    process.env[key] = value;
    t.after(() => {
      if (original === undefined) delete process.env[key];
      else process.env[key] = original;
    });
  }
  const specifier = `./config.ts?${crypto.randomUUID()}`;
  return (await import(specifier)) as typeof import('./config.ts');
};

const configuredEnvironment = {
  UNCHAINED_ACP_API_KEY: 'test-api-key',
  UNCHAINED_ACP_PAYMENT_PROVIDER_ID: 'payment-provider-id',
  ACP_CHECKOUT_CONTINUE_URL: 'https://shop.example.test/checkout',
  ROOT_URL: 'https://initial.example.test',
};

describe('ACP config is env-driven, not Stripe-hardcoded', () => {
  it('adopts a non-Stripe adapter + handler configured purely via env', async (t) => {
    const {
      acpConfig,
      acpPaymentAdapterKeys,
      getACPApiBaseUrl,
      getACPConfigurationErrors,
      isACPAdapterKeyAllowed,
      isACPHandlerAccepted,
    } = await importConfigWith(t, {
      ...configuredEnvironment,
      ACP_PAYMENT_ADAPTER_KEYS: 'com.acme.payment.adyen,org.example.paypal',
      ACP_PAYMENT_HANDLER_ID: 'adyen_token',
      ACP_PAYMENT_HANDLER_PSP: 'adyen',
      ACP_PAYMENT_HANDLER_DISPLAY_NAME: 'Adyen Card',
      ACP_PAYMENT_MERCHANT_ID: 'merchant-adyen',
    });

    assert.deepEqual(acpPaymentAdapterKeys, ['com.acme.payment.adyen', 'org.example.paypal']);
    assert.equal(isACPAdapterKeyAllowed('com.acme.payment.adyen'), true);
    assert.equal(isACPAdapterKeyAllowed('org.example.paypal'), true);
    assert.equal(isACPAdapterKeyAllowed('shop.unchained.payment.stripe'), false);

    assert.equal(acpConfig.paymentHandler.id, 'adyen_token');
    assert.equal(acpConfig.paymentHandler.psp, 'adyen');
    assert.equal(acpConfig.paymentHandler.display_name, 'Adyen Card');
    assert.equal(acpConfig.paymentHandler.config.merchant_id, 'merchant-adyen');
    assert.equal(acpConfig.paymentHandler.config.psp, 'adyen');
    assert.equal(isACPHandlerAccepted('adyen_token'), true);
    assert.equal(isACPHandlerAccepted('stripe_spt'), false);
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

  it('loads with a relative ROOT_URL and reports it instead of throwing', async (t) => {
    const { getACPConfigurationErrors } = await importConfigWith(t, {
      ...configuredEnvironment,
      ACP_PAYMENT_MERCHANT_ID: 'merchant-id',
      ROOT_URL: 'example.com',
    });

    assert.ok(
      getACPConfigurationErrors().includes('ROOT_URL or ACP_SELLER_URL must be an absolute URL'),
    );
  });
});
