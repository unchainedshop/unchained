import type { Stripe } from 'stripe';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:stripe');

export const { STRIPE_SECRET, STRIPE_WEBHOOK_ENVIRONMENT, EMAIL_WEBSITE_NAME } = process.env;

export let stripe: Stripe;
export const stripeEnvironment = STRIPE_WEBHOOK_ENVIRONMENT ?? null;

if (!STRIPE_SECRET) {
  logger.warn('STRIPE_SECRET is not set, skipping initialization');
} else {
  try {
    const { default: Stripe } = await import('stripe');
    stripe = new Stripe(STRIPE_SECRET, {
      apiVersion: '2026-05-27.dahlia',
    });
  } catch {
    logger.warn(`optional peer npm package 'stripe' not installed, stripe adapter will not work`);
  }
}
