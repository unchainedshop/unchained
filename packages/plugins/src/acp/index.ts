import { createLogger } from '@unchainedshop/logger';
import type { IPlugin } from '@unchainedshop/core';
import { acpConfig, getACPConfigurationErrors } from './config.ts';
import { configureACPWebhooks } from './webhook.ts';
import { createACPRoute } from './http.ts';
import {
  cancelCheckoutSession,
  completeCheckoutSession,
  createCheckoutSession,
  getCheckoutSession,
  updateCheckoutSession,
} from './checkout.ts';
import { discoverACP, paymentHandlerConfigSchema, paymentInstrumentSchema } from './discovery.ts';
import { buildACPProductFeed } from './feed.ts';

const logger = createLogger('unchained:acp');
const base = acpConfig.apiPath;

// Agentic Commerce Protocol (2026-04-17) as a self-contained plugin: the checkout
// surface is declarative `routes`, and outbound order webhooks are wired in
// `onRegister`. It registers NO payment adapter — it consumes whichever adapter
// the configured provider uses (Stripe SPT ships as the default rail).
export const ACPPlugin: IPlugin = {
  key: 'shop.unchained.acp',
  label: 'Agentic Commerce Protocol',
  version: '1.0.0',

  routes: [
    createACPRoute(
      `${base}/checkout_sessions`,
      'POST',
      'create_checkout_session',
      createCheckoutSession,
    ),
    createACPRoute(`${base}/checkout_sessions/:id`, 'GET', 'get_checkout_session', getCheckoutSession),
    createACPRoute(
      `${base}/checkout_sessions/:id`,
      'POST',
      'update_checkout_session',
      updateCheckoutSession,
    ),
    createACPRoute(
      `${base}/checkout_sessions/:id/complete`,
      'POST',
      'complete_checkout_session',
      completeCheckoutSession,
    ),
    createACPRoute(
      `${base}/checkout_sessions/:id/cancel`,
      'POST',
      'cancel_checkout_session',
      cancelCheckoutSession,
    ),
    createACPRoute(`${base}/feed.jsonl`, 'GET', 'get_product_feed', async (_request, context) => ({
      status: 200,
      body: await buildACPProductFeed(context),
      contentType: 'application/x-ndjson; charset=utf-8',
    })),
    createACPRoute('/.well-known/acp.json', 'GET', 'discover_acp', discoverACP, {
      authenticate: false,
    }),
    createACPRoute(
      '/.well-known/acp/schemas/payment-handler-config.json',
      'GET',
      'payment_handler_config_schema',
      paymentHandlerConfigSchema,
      { authenticate: false },
    ),
    createACPRoute(
      '/.well-known/acp/schemas/payment-instrument.json',
      'GET',
      'payment_instrument_schema',
      paymentInstrumentSchema,
      { authenticate: false },
    ),
  ],

  onRegister: () => {
    if (!acpConfig.apiKey) {
      logger.warn('ACP not configured (UNCHAINED_ACP_API_KEY missing) — skipping ACP routes');
      return false;
    }
    const configurationErrors = getACPConfigurationErrors();
    if (configurationErrors.length) {
      logger.warn(`ACP configuration is invalid: ${configurationErrors.join('; ')}`);
      return false;
    }
    configureACPWebhooks();
    return true;
  },
};

export default ACPPlugin;
