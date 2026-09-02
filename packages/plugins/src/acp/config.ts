import type { UnchainedCore } from '@unchainedshop/core';

export const ACP_API_VERSION = '2026-04-17';

// The runtime context a plugin route handler receives: UnchainedCore (modules,
// services) spread with the per-request context the api middleware stashes on
// `req.unchainedContext` (headers, locale, country, user, loaders).
export type ACPContext = UnchainedCore & {
  getHeader: (name: string) => string | undefined;
  setHeader?: (name: string, value: string) => void;
  locale?: any;
  countryCode: string;
  currencyCode: string;
  remoteAddress?: string;
  remotePort?: number;
  loaders?: any;
  userId?: string;
  params?: Record<string, string>;
};

const SCHEMA_BASE = `https://raw.githubusercontent.com/agentic-commerce-protocol/agentic-commerce-protocol/main/spec/${ACP_API_VERSION}/json-schema/schema.agentic_checkout.json`;

const {
  ACP_API_PATH = '/acp',
  UNCHAINED_ACP_API_KEY,
  UNCHAINED_ACP_PAYMENT_PROVIDER_ID,
  ACP_CHECKOUT_CONTINUE_URL,
  ACP_IDEMPOTENCY_CONFLICT_STATUS = '422',
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
  ACP_WEBHOOK_EVENT_TENSE = 'past',
  ACP_PAYMENT_HANDLER_ID = 'stripe_spt',
  ACP_PAYMENT_HANDLER_NAME = 'dev.acp.tokenized.card',
  ACP_PAYMENT_HANDLER_DISPLAY_NAME = 'Card',
  ACP_PAYMENT_HANDLER_VERSION = '2026-01-22',
  ACP_PAYMENT_HANDLER_PSP = 'stripe',
  ACP_PAYMENT_HANDLER_CONFIG,
  ACP_PAYMENT_ADAPTER_KEYS = 'shop.unchained.payment.stripe',
} = process.env;

const parseList = (raw: string) =>
  raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const parseJSONObject = (raw: string | undefined): Record<string, unknown> => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

// ACP payment is PSP-agnostic (Payment Handlers Framework, 2026-04-17): a handler
// advertises a free-form `psp` and a delegated-token flow. Stripe SPT is the only
// executable rail today, but the advertisement is config-driven so a merchant can
// re-point it (or a future adapter can register paypal/adyen) without a code fork.
// `config` lets the merchant surface handler-specific data (e.g. their Stripe
// publishable key / connected account) that the agent's PSP needs to mint the token.
export const acpPaymentHandler = {
  id: ACP_PAYMENT_HANDLER_ID,
  name: ACP_PAYMENT_HANDLER_NAME,
  display_name: ACP_PAYMENT_HANDLER_DISPLAY_NAME,
  version: ACP_PAYMENT_HANDLER_VERSION,
  spec: 'https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/rfcs/rfc.payment_handlers.md',
  requires_delegate_payment: true,
  requires_pci_compliance: false,
  psp: ACP_PAYMENT_HANDLER_PSP,
  config_schema: `${SCHEMA_BASE}#/$defs/PaymentHandler`,
  instrument_schemas: [`${SCHEMA_BASE}#/$defs/PaymentData`],
  config: parseJSONObject(ACP_PAYMENT_HANDLER_CONFIG),
} as const;

// Payment `handler_id` / `provider` values accepted on complete. Includes the
// configured handler id + psp plus the historical stripe aliases for back-compat.
export const acpAcceptedHandlerIds = [
  ...new Set([acpPaymentHandler.id, acpPaymentHandler.psp, 'stripe_spt', 'stripe']),
];

// Unchained payment-adapter keys whose `charge()` can consume an ACP delegated
// token (i.e. read the generic `acpToken`/`acpHandlerId` from `paymentContext`).
// The ACP layer is adapter-agnostic — Stripe SPT ships as the default, but any
// adapter implementing that contract can be enabled here with no ACP-layer fork.
export const acpPaymentAdapterKeys = parseList(ACP_PAYMENT_ADAPTER_KEYS);

export const isAcpAdapterKeyAllowed = (
  adapterKey: string | undefined,
  allowed: readonly string[] = acpPaymentAdapterKeys,
) => !!adapterKey && allowed.includes(adapterKey);

export const isAcpHandlerAccepted = (
  handlerId: string | undefined,
  accepted: readonly string[] = acpAcceptedHandlerIds,
) => !!handlerId && accepted.includes(handlerId);

export const acpConfig = {
  apiPath: ACP_API_PATH,
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
  webhookRetries: Math.max(0, Number.parseInt(ACP_WEBHOOK_RETRIES, 10) || 0),
  webhookEventTense: ACP_WEBHOOK_EVENT_TENSE === 'present' ? 'present' : 'past',
  idempotencyConflictStatus: ACP_IDEMPOTENCY_CONFLICT_STATUS === '409' ? 409 : 422,
  paymentHandler: acpPaymentHandler,
  paymentAdapterKeys: acpPaymentAdapterKeys,
} as const;
