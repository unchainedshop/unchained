import { createLogger } from '@unchainedshop/logger';
import type { IPlugin } from '@unchainedshop/core';
import { acpConfig } from './config.ts';
import { handleACPRequest, wellKnownACPHandler } from './handler.ts';
import { configureACPWebhooks } from './webhook.ts';

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
    { path: `${base}/checkout_sessions`, method: 'POST', handler: handleACPRequest },
    { path: `${base}/checkout_sessions/:id`, method: 'GET', handler: handleACPRequest },
    { path: `${base}/checkout_sessions/:id`, method: 'POST', handler: handleACPRequest },
    { path: `${base}/checkout_sessions/:id/complete`, method: 'POST', handler: handleACPRequest },
    { path: `${base}/checkout_sessions/:id/cancel`, method: 'POST', handler: handleACPRequest },
    { path: `${base}/feed.jsonl`, method: 'GET', handler: handleACPRequest },
    { path: '/.well-known/acp.json', method: 'GET', handler: wellKnownACPHandler },
  ],

  onRegister: () => {
    if (!acpConfig.apiKey) {
      logger.warn('ACP not configured (UNCHAINED_ACP_API_KEY missing) — skipping ACP routes');
      return false;
    }
    configureACPWebhooks();
    return true;
  },
};

export default ACPPlugin;
