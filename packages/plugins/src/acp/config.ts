import type { PluginHttpRequestContext } from '@unchainedshop/core';

export const ACP_API_VERSION = '2026-04-17';
export type ACPContext = PluginHttpRequestContext;

const {
  ACP_API_PATH = '/acp',
  UNCHAINED_ACP_API_KEY,
  UNCHAINED_ACP_PAYMENT_PROVIDER_ID,
  ACP_CHECKOUT_CONTINUE_URL,
  ACP_SELLER_NAME,
  ACP_SELLER_URL,
  ACP_SELLER_PRIVACY_POLICY,
  ACP_SELLER_TOS,
  ACP_PRODUCT_URL_BASE,
  ACP_TARGET_COUNTRIES,
  ACP_WEBHOOK_URL,
  OPENAI_WEBHOOK_URL,
  ACP_WEBHOOK_SECRET,
  OPENAI_WEBHOOK_SECRET,
  ACP_WEBHOOK_RETRIES = '5',
  ACP_PAYMENT_HANDLER_ID = 'stripe_spt',
  ACP_PAYMENT_HANDLER_NAME = 'dev.acp.tokenized.card',
  ACP_PAYMENT_HANDLER_DISPLAY_NAME = 'Card',
  ACP_PAYMENT_HANDLER_VERSION = '2026-01-22',
  ACP_PAYMENT_HANDLER_PSP = 'stripe',
  ACP_PAYMENT_HANDLER_CONFIG,
  ACP_PAYMENT_MERCHANT_ID,
  ACP_PAYMENT_ADAPTER_KEYS = 'shop.unchained.payment.stripe',
} = process.env;

const parseList = (raw: string) =>
  raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const parsedPaymentHandlerConfig: { value: Record<string, unknown>; error?: string } = (() => {
  if (!ACP_PAYMENT_HANDLER_CONFIG) return { value: {} as Record<string, unknown> };
  try {
    const value = JSON.parse(ACP_PAYMENT_HANDLER_CONFIG);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { value: {}, error: 'ACP_PAYMENT_HANDLER_CONFIG must be a JSON object' };
    }
    return { value: value as Record<string, unknown> };
  } catch {
    return { value: {}, error: 'ACP_PAYMENT_HANDLER_CONFIG must contain valid JSON' };
  }
})();

const publicRoot = () =>
  (process.env.ROOT_URL || ACP_SELLER_URL || 'http://localhost:4010').replace(/\/$/, '');

export const getACPApiBaseUrl = () => {
  if (process.env.ACP_API_BASE_URL) return process.env.ACP_API_BASE_URL.replace(/\/$/, '');
  return new URL(ACP_API_PATH.replace(/^\//, ''), `${publicRoot()}/`).toString().replace(/\/$/, '');
};

export const getACPPaymentHandler = () => {
  const config = {
    ...parsedPaymentHandlerConfig.value,
    psp: parsedPaymentHandlerConfig.value.psp || ACP_PAYMENT_HANDLER_PSP,
    ...(ACP_PAYMENT_MERCHANT_ID || parsedPaymentHandlerConfig.value.merchant_id
      ? {
          merchant_id: ACP_PAYMENT_MERCHANT_ID || parsedPaymentHandlerConfig.value.merchant_id,
        }
      : {}),
  };
  const schemaRoot = publicRoot();

  return {
    id: ACP_PAYMENT_HANDLER_ID,
    name: ACP_PAYMENT_HANDLER_NAME,
    display_name: ACP_PAYMENT_HANDLER_DISPLAY_NAME,
    version: ACP_PAYMENT_HANDLER_VERSION,
    spec: 'https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/rfcs/rfc.payment_handlers.md',
    requires_delegate_payment: true,
    requires_pci_compliance: false,
    psp: ACP_PAYMENT_HANDLER_PSP,
    config_schema: new URL(
      '/.well-known/acp/schemas/payment-handler-config.json',
      schemaRoot,
    ).toString(),
    instrument_schemas: [
      new URL('/.well-known/acp/schemas/payment-instrument.json', schemaRoot).toString(),
    ],
    config,
  } as const;
};

export const acpPaymentHandler = getACPPaymentHandler();

export const getAcpAcceptedHandlerIds = (
  handler: ReturnType<typeof getACPPaymentHandler> = getACPPaymentHandler(),
) => [
  ...new Set([
    handler.id,
    handler.psp,
    ...(handler.psp.toLowerCase() === 'stripe' ? ['stripe_spt', 'stripe'] : []),
  ]),
];

export const acpAcceptedHandlerIds = getAcpAcceptedHandlerIds(acpPaymentHandler);
export const acpPaymentAdapterKeys = parseList(ACP_PAYMENT_ADAPTER_KEYS);

export const isAcpAdapterKeyAllowed = (
  adapterKey: string | undefined,
  allowed: readonly string[] = acpPaymentAdapterKeys,
) => !!adapterKey && allowed.includes(adapterKey);

export const isAcpHandlerAccepted = (
  handlerId: string | undefined,
  accepted: readonly string[] = getAcpAcceptedHandlerIds(),
) => !!handlerId && accepted.includes(handlerId);

export const getACPConfigurationErrors = () => {
  if (!UNCHAINED_ACP_API_KEY) return [];
  const errors = [parsedPaymentHandlerConfig.error].filter(Boolean) as string[];
  if (!UNCHAINED_ACP_PAYMENT_PROVIDER_ID) {
    errors.push('UNCHAINED_ACP_PAYMENT_PROVIDER_ID is required');
  }
  if (!ACP_CHECKOUT_CONTINUE_URL) errors.push('ACP_CHECKOUT_CONTINUE_URL is required');

  try {
    const paymentHandler = getACPPaymentHandler();
    if (!paymentHandler.config.merchant_id) {
      errors.push('ACP_PAYMENT_MERCHANT_ID or config.merchant_id is required');
    }
    if (!paymentHandler.psp) errors.push('ACP_PAYMENT_HANDLER_PSP is required');
    if (paymentHandler.config.psp !== paymentHandler.psp) {
      errors.push('Payment handler config.psp must match ACP_PAYMENT_HANDLER_PSP');
    }
  } catch {
    errors.push('ROOT_URL or ACP_SELLER_URL must be an absolute URL');
  }
  if (!acpPaymentAdapterKeys.length) errors.push('ACP_PAYMENT_ADAPTER_KEYS is required');
  const webhookUrl = ACP_WEBHOOK_URL || OPENAI_WEBHOOK_URL;
  const webhookSecret = ACP_WEBHOOK_SECRET || OPENAI_WEBHOOK_SECRET;
  if (!!webhookUrl !== !!webhookSecret) {
    errors.push('ACP webhook URL and secret must be configured together');
  }

  let apiBaseUrl: string | undefined;
  try {
    apiBaseUrl = getACPApiBaseUrl();
  } catch {
    errors.push('ACP_API_BASE_URL must be an absolute HTTP(S) URL');
  }
  for (const [name, value] of [
    ['ACP_API_BASE_URL', apiBaseUrl],
    ['ACP_CHECKOUT_CONTINUE_URL', ACP_CHECKOUT_CONTINUE_URL],
    ['ACP_SELLER_URL', ACP_SELLER_URL],
    ['ACP_PRODUCT_URL_BASE', ACP_PRODUCT_URL_BASE],
    ['ACP_SELLER_PRIVACY_POLICY', ACP_SELLER_PRIVACY_POLICY],
    ['ACP_SELLER_TOS', ACP_SELLER_TOS],
    ['ACP_WEBHOOK_URL', webhookUrl],
  ] as const) {
    if (!value) continue;
    try {
      const url = new URL(value);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Invalid protocol');
    } catch {
      errors.push(`${name} must be an absolute HTTP(S) URL`);
    }
  }
  return [...new Set(errors)];
};

export const acpConfig = {
  apiPath: ACP_API_PATH.replace(/\/$/, ''),
  apiKey: UNCHAINED_ACP_API_KEY,
  paymentProviderId: UNCHAINED_ACP_PAYMENT_PROVIDER_ID,
  continueUrl: ACP_CHECKOUT_CONTINUE_URL,
  sellerName: ACP_SELLER_NAME,
  sellerUrl: ACP_SELLER_URL,
  sellerPrivacyPolicy: ACP_SELLER_PRIVACY_POLICY,
  sellerTerms: ACP_SELLER_TOS,
  productUrlBase: ACP_PRODUCT_URL_BASE,
  targetCountries: ACP_TARGET_COUNTRIES?.split(',')
    .map((country) => country.trim().toUpperCase())
    .filter(Boolean),
  webhookUrl: ACP_WEBHOOK_URL || OPENAI_WEBHOOK_URL,
  webhookSecret: ACP_WEBHOOK_SECRET || OPENAI_WEBHOOK_SECRET,
  webhookRetries: Math.min(10, Math.max(0, Number.parseInt(ACP_WEBHOOK_RETRIES, 10) || 0)),
  get paymentHandler() {
    return getACPPaymentHandler();
  },
  paymentAdapterKeys: acpPaymentAdapterKeys,
} as const;
