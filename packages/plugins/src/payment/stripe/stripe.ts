import { IOrderPricingSheet } from '@unchainedshop/core';
import { Order, OrderPayment } from '@unchainedshop/core-orders';
import { createLogger } from '@unchainedshop/logger';
import { Stripe as StripeType } from 'stripe';

const logger = createLogger('unchained:plugins:payment:stripe');

const { STRIPE_SECRET, STRIPE_WEBHOOK_ENVIRONMENT, EMAIL_WEBSITE_NAME } = process.env;

let stripe: Awaited<ReturnType<typeof initStripeClient>> | null;

export const initStripeClient = async (): Promise<StripeType | null> => {
  if (!STRIPE_SECRET) {
    logger.warn('STRIPE_SECRET is not set, skipping initialization');
    return Promise.resolve(null);
  }
  // eslint-disable-next-line
  // @ts-ignore
  const { default: Stripe } = await import('stripe');
  stripe = new Stripe(STRIPE_SECRET, {
    apiVersion: '2025-08-27.basil',
  });
  return stripe;
};

initStripeClient().catch(logger.warn);

export default function getStripe() {
  if (!stripe) {
    throw new Error('Stripe client not initialized');
  }
  return stripe;
}

const environment = STRIPE_WEBHOOK_ENVIRONMENT ?? null;

export const upsertCustomer = async ({ userId, name, email }): Promise<string> => {
  try {
    const { data } = await getStripe().customers.search({ query: `metadata["userId"]:"${userId}"` });
    const existingCustomer = data[0];

    if (
      existingCustomer.name !== name ||
      existingCustomer.email !== email ||
      existingCustomer.metadata.environment !== environment
    ) {
      const updatedCustomer = await getStripe().customers.update(existingCustomer.id, {
        metadata: {
          userId,
          environment,
        },
        name,
        email,
      });
      return updatedCustomer.id;
    }

    return existingCustomer.id;
  } catch {
    const customer = await getStripe().customers.create({
      metadata: {
        userId,
        environment: STRIPE_WEBHOOK_ENVIRONMENT ?? null,
      },
      name,
      email,
    });
    return customer.id;
  }
};

export const createRegistrationIntent = async (
  {
    userId,
    name,
    email,
    paymentProviderId,
    descriptorPrefix,
  }: {
    userId: string;
    name: string;
    email: string;
    paymentProviderId: string;
    descriptorPrefix?: string;
  },
  options: Record<string, any> = {},
) => {
  const customer = options?.customer || (await upsertCustomer({ userId, name, email }));
  const description =
    `${options?.description || descriptorPrefix || EMAIL_WEBSITE_NAME || 'Unchained'}`.trim();

  const setupIntent = await getStripe().setupIntents.create({
    description,
    customer,
    metadata: {
      userId,
      paymentProviderId,
      environment,
    },
    usage: 'off_session',
    ...options,
  });
  return setupIntent;
};

export const createOrderPaymentIntent = async (
  {
    userId,
    name,
    email,
    order,
    orderPayment,
    pricing,
    descriptorPrefix,
  }: {
    userId: string;
    name: string;
    email: string;
    order: Order;
    orderPayment: OrderPayment;
    pricing: IOrderPricingSheet;
    descriptorPrefix?: string;
  },
  options: Record<string, any> = {},
) => {
  const description =
    `${options?.description || descriptorPrefix || EMAIL_WEBSITE_NAME || 'Unchained'}`.trim();
  const customer = options?.customer || (await upsertCustomer({ userId, name, email }));

  const { currencyCode, amount } = pricing.total({ useNetPrice: false });

  const paymentIntent = await getStripe().paymentIntents.create({
    amount: Math.round(amount),
    currency: currencyCode.toLowerCase(),
    description,
    statement_descriptor_suffix: `${order._id.substring(0, 4)}..${order._id.substring(order._id.length - 4)}`,
    setup_future_usage: 'off_session', // Verify your integration in this guide by including this parameter
    customer,
    receipt_email: order.contact?.emailAddress,
    metadata: {
      orderPaymentId: orderPayment._id,
      orderId: order._id,
      userId,
      environment,
    },
    ...options,
  });
  return paymentIntent;
};
