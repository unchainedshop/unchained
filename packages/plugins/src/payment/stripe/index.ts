import { createLogger } from '@unchainedshop/logger';
import type { IPlugin } from '@unchainedshop/core';
import { Stripe } from './adapter.ts';
import { stripeWebhookHandler } from './api.ts';

const { STRIPE_WEBHOOK_PATH = '/payment/stripe/webhook' } = process.env;

const logger = createLogger('unchained:stripe');

// Plugin definition
export const StripePlugin: IPlugin = {
  key: 'shop.unchained.payment.stripe',
  label: 'Stripe Payment Plugin',
  version: '2.0.0',

  adapters: [Stripe],

  routes: [
    {
      path: STRIPE_WEBHOOK_PATH,
      method: 'POST',
      handler: stripeWebhookHandler,
    },
  ],

  onRegister: () => {
    if (!process.env.STRIPE_SECRET) {
      throw new Error('STRIPE_SECRET not set');
    }
    if (!process.env.STRIPE_ENDPOINT_SECRET) {
      logger.warn('STRIPE_ENDPOINT_SECRET not set - webhooks will not work');
    }
  },
};

export default StripePlugin;

// Re-export adapter for direct use
export { Stripe } from './adapter.ts';
