export const ACP_API_VERSION = '2026-04-17';

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
} = process.env;

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
} as const;
