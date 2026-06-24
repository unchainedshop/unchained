import { createLogger } from '@unchainedshop/logger';
import type { Stripe } from 'stripe';
import { EMAIL_WEBSITE_NAME, stripe, stripeEnvironment } from './stripe.ts';
import { upsertCustomer, type StripeUserData } from './customers.ts';

const logger = createLogger('unchained:stripe');

export const createRegistrationIntent = async (
  {
    userId,
    name,
    email,
    paymentProviderId,
    descriptorPrefix,
  }: StripeUserData & {
    paymentProviderId: string;
    descriptorPrefix?: string;
  },
  options: Record<string, any> = {},
  stripeClient: Stripe = stripe,
) => {
  const customer = options?.customer || (await upsertCustomer({ userId, name, email }, stripeClient));
  const description =
    `${options?.description || descriptorPrefix || EMAIL_WEBSITE_NAME || 'Unchained'}`.trim();

  return stripeClient.setupIntents.create({
    description,
    customer,
    metadata: {
      userId,
      paymentProviderId,
      environment: stripeEnvironment,
    },
    usage: 'off_session',
    ...options,
  });
};

export const retrieveSetupIntentCredentials = async (
  { setupIntentId }: { setupIntentId?: string },
  stripeClient: Stripe = stripe,
) => {
  if (!setupIntentId) {
    throw new Error('You have to provide a setupIntentId');
  }

  const setupIntent = await stripeClient.setupIntents.retrieve(setupIntentId);
  if (setupIntent.status === 'succeeded') {
    return {
      token: setupIntent.payment_method,
      customer: setupIntent.customer,
      payment_method_types: setupIntent.payment_method_types,
      usage: setupIntent.usage,
    };
  }

  logger.warn('Registration declined', setupIntentId);
  return null;
};
