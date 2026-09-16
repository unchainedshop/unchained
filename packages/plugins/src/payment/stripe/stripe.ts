import type StripeClient from 'stripe';
import type { IOrderPricingSheet } from '@unchainedshop/core';
import type { Order, OrderPayment } from '@unchainedshop/core-orders';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:stripe');

const { STRIPE_SECRET, STRIPE_WEBHOOK_ENVIRONMENT, EMAIL_WEBSITE_NAME } = process.env;

export const STRIPE_API_VERSION = '2026-08-26.dahlia';
export const ACP_SPT_STRIPE_VERSION = '2026-04-22.preview';
export const stripeEnvironment = STRIPE_WEBHOOK_ENVIRONMENT || '';

export let stripe: StripeClient;

if (STRIPE_SECRET) {
  try {
    const { default: Stripe } = await import('stripe');
    stripe = new Stripe(STRIPE_SECRET, { apiVersion: STRIPE_API_VERSION });
  } catch (error) {
    logger.warn(`optional peer npm package 'stripe' could not be initialized`, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const escapeSearchValue = (value: string) => value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');

const metadataFrom = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {};

const withoutAuthoritativeFields = (options: Record<string, any>, authoritativeFields: string[]) => {
  const forwardedOptions = { ...options };
  for (const field of authoritativeFields) delete forwardedOptions[field];
  return forwardedOptions;
};

export const upsertCustomer = async (
  {
    userId,
    name,
    email,
  }: {
    userId: string;
    name?: string;
    email?: string;
  },
  stripeClient: StripeClient = stripe,
): Promise<string> => {
  const { data } = await stripeClient.customers.search({
    query: `metadata["userId"]:"${escapeSearchValue(userId)}"`,
    limit: 1,
  });
  const existingCustomer = data[0];
  const metadata = { userId, environment: stripeEnvironment };

  if (!existingCustomer) {
    const customer = await stripeClient.customers.create({ metadata, name, email });
    return customer.id;
  }

  if (
    existingCustomer.name !== (name || null) ||
    existingCustomer.email !== (email || null) ||
    (existingCustomer.metadata.environment || '') !== stripeEnvironment
  ) {
    const updatedCustomer = await stripeClient.customers.update(existingCustomer.id, {
      metadata,
      name,
      email,
    });
    return updatedCustomer.id;
  }

  return existingCustomer.id;
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
    name?: string;
    email?: string;
    paymentProviderId: string;
    descriptorPrefix?: string;
  },
  options: Record<string, any> = {},
  stripeClient: StripeClient = stripe,
) => {
  const customer = await upsertCustomer({ userId, name, email }, stripeClient);
  const description =
    `${options.description || descriptorPrefix || EMAIL_WEBSITE_NAME || 'Unchained'}`.trim();
  const metadata = metadataFrom(options.metadata);
  const forwardedOptions = withoutAuthoritativeFields(options, [
    'customer',
    'description',
    'metadata',
    'usage',
  ]);

  return stripeClient.setupIntents.create({
    ...forwardedOptions,
    customer,
    description,
    metadata: {
      ...metadata,
      userId,
      paymentProviderId,
      environment: stripeEnvironment,
    },
    usage: 'off_session',
  });
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
    customerId,
  }: {
    userId: string;
    name?: string;
    email?: string;
    order: Order;
    orderPayment: OrderPayment;
    pricing: IOrderPricingSheet;
    descriptorPrefix?: string;
    customerId?: string;
  },
  options: Record<string, any> = {},
  stripeClient: StripeClient = stripe,
) => {
  const description =
    `${options.description || descriptorPrefix || EMAIL_WEBSITE_NAME || 'Unchained'}`.trim();
  const customer = customerId || (await upsertCustomer({ userId, name, email }, stripeClient));
  const { currencyCode, amount } = pricing.total({ useNetPrice: false });
  const metadata = metadataFrom(options.metadata);
  const forwardedOptions = withoutAuthoritativeFields(options, [
    'amount',
    'currency',
    'customer',
    'description',
    'metadata',
    'receipt_email',
    'statement_descriptor_suffix',
  ]);

  return stripeClient.paymentIntents.create({
    setup_future_usage: 'off_session',
    ...forwardedOptions,
    amount: Math.round(amount),
    currency: currencyCode.toLowerCase(),
    customer,
    description,
    statement_descriptor_suffix: `${order._id.substring(0, 4)}..${order._id.substring(order._id.length - 4)}`,
    receipt_email: order.contact?.emailAddress,
    metadata: {
      ...metadata,
      orderPaymentId: orderPayment._id,
      orderId: order._id,
      userId,
      environment: stripeEnvironment,
    },
  });
};

// Stripe's Shared Payment Token surface is Preview-versioned independently of
// the stable API used for ordinary PaymentIntents. The token is single-use and
// must never be stored by the adapter.
export const createAcpSharedPaymentTokenIntent = async (
  {
    acpToken,
    order,
    orderPayment,
    pricing,
    descriptorPrefix,
  }: {
    acpToken: string;
    order: Order;
    orderPayment: OrderPayment;
    pricing: IOrderPricingSheet;
    descriptorPrefix?: string;
  },
  stripeClient: StripeClient = stripe,
) => {
  const { currencyCode, amount } = pricing.total({ useNetPrice: false });
  const description = `${descriptorPrefix || EMAIL_WEBSITE_NAME || 'Unchained agentic checkout'}`.trim();

  return stripeClient.paymentIntents.create(
    {
      amount: Math.round(amount),
      currency: currencyCode.toLowerCase(),
      confirm: true,
      description,
      statement_descriptor_suffix: `${order._id.substring(0, 4)}..${order._id.substring(order._id.length - 4)}`,
      receipt_email: order.contact?.emailAddress,
      metadata: {
        orderPaymentId: orderPayment._id,
        orderId: order._id,
        environment: stripeEnvironment,
      },
      payment_method_data: { shared_payment_granted_token: acpToken } as any,
    },
    {
      apiVersion: ACP_SPT_STRIPE_VERSION,
      idempotencyKey: `acp-${orderPayment._id}`,
    },
  );
};
