import { Order } from '@unchainedshop/core-orders';
import { OrderPayment } from '@unchainedshop/core-orders';
import { IOrderPricingSheet } from '@unchainedshop/core-orders';
import { createLogger } from '@unchainedshop/logger';
import type { Stripe as StripeType } from 'stripe';

const logger = createLogger('unchained:plugins:payment:stripe');

const { STRIPE_SECRET, STRIPE_WEBHOOK_ENVIRONMENT, EMAIL_WEBSITE_NAME } = process.env;

let stripe: Awaited<ReturnType<typeof initStripeClient>> | null;

export const initStripeClient = async (): Promise<StripeType> => {
  if (!STRIPE_SECRET) {
    logger.warn('STRIPE_SECRET is not set, skipping initialization');
    return null;
  }
  const { default: Stripe } = await import('stripe');
  stripe = new Stripe(STRIPE_SECRET, {
    apiVersion: '2024-10-28.acacia',
  });
  return stripe;
};

initStripeClient().catch(logger.warn);

export default function () {
  return stripe;
}

const environment = STRIPE_WEBHOOK_ENVIRONMENT ?? null;

export const upsertCustomer = async ({ userId, name, email }): Promise<string> => {
  try {
    const { data } = await stripe.customers.search({ query: `metadata["userId"]:"${userId}"` });
    const existingCustomer = data[0];

    if (
      existingCustomer.name !== name ||
      existingCustomer.email !== email ||
      existingCustomer.metadata.environment !== environment
    ) {
      const updatedCustomer = await stripe.customers.update(existingCustomer.id, {
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
    const customer = await stripe.customers.create({
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
  const description = `${descriptorPrefix || EMAIL_WEBSITE_NAME || 'Unchained'}`.trim();

  const setupIntent = await stripe.setupIntents.create({
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
  const description = `${descriptorPrefix || EMAIL_WEBSITE_NAME || 'Unchained'}`.trim();
  const customer = options?.customer || (await upsertCustomer({ userId, name, email }));

  const { currency, amount } = pricing.total({ useNetPrice: false });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount),
    currency: currency.toLowerCase(),
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
