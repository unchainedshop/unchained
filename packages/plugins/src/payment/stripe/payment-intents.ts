import type { IOrderPricingSheet } from '@unchainedshop/core';
import type { Order, OrderPayment } from '@unchainedshop/core-orders';
import type { Stripe } from 'stripe';
import { EMAIL_WEBSITE_NAME, stripe } from './stripe.ts';
import { upsertCustomer, type StripeUserData } from './customers.ts';
import {
  buildOrderPaymentMetadata,
  buildStatementDescriptorSuffix,
  resolveStripePaymentTotal,
} from './metadata.ts';

type AcpSharedPaymentMethodData = Stripe.PaymentIntentCreateParams.PaymentMethodData & {
  shared_payment_granted_token: string;
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
  }: StripeUserData & {
    order: Order;
    orderPayment: OrderPayment;
    pricing: IOrderPricingSheet;
    descriptorPrefix?: string;
  },
  options: Record<string, any> = {},
  stripeClient: Stripe = stripe,
) => {
  const description =
    `${options?.description || descriptorPrefix || EMAIL_WEBSITE_NAME || 'Unchained'}`.trim();
  const customer = options?.customer || (await upsertCustomer({ userId, name, email }, stripeClient));
  const { amount, currency } = resolveStripePaymentTotal(pricing);

  return stripeClient.paymentIntents.create({
    amount,
    currency,
    description,
    statement_descriptor_suffix: buildStatementDescriptorSuffix(order._id),
    setup_future_usage: 'off_session',
    customer,
    receipt_email: order.contact?.emailAddress,
    metadata: buildOrderPaymentMetadata({ order, orderPayment, userId }),
    ...options,
  });
};

export const createStoredCredentialPaymentIntent = async (
  {
    paymentCredentials,
    ...input
  }: StripeUserData & {
    order: Order;
    orderPayment: OrderPayment;
    pricing: IOrderPricingSheet;
    descriptorPrefix?: string;
    paymentCredentials: any;
  },
  stripeClient: Stripe = stripe,
) => {
  return createOrderPaymentIntent(
    input,
    {
      customer: paymentCredentials.meta?.customer,
      confirm: true,
      payment_method: paymentCredentials.token,
      payment_method_types: paymentCredentials.meta?.payment_method_types,
    },
    stripeClient,
  );
};

export const retrievePaymentIntent = async (paymentIntentId: string, stripeClient: Stripe = stripe) => {
  return stripeClient.paymentIntents.retrieve(paymentIntentId);
};

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
  stripeClient: Stripe = stripe,
) => {
  const { amount, currency } = resolveStripePaymentTotal(pricing);

  return stripeClient.paymentIntents.create(
    {
      amount,
      currency,
      confirm: true,
      description: descriptorPrefix || 'Unchained agentic checkout',
      statement_descriptor_suffix: buildStatementDescriptorSuffix(order._id),
      receipt_email: order.contact?.emailAddress,
      metadata: buildOrderPaymentMetadata({ order, orderPayment }),
      payment_method_data: {
        shared_payment_granted_token: acpToken,
      } as AcpSharedPaymentMethodData,
    },
    {
      apiVersion: '2026-04-22.preview',
      idempotencyKey: `acp-${orderPayment._id}`,
    },
  );
};
