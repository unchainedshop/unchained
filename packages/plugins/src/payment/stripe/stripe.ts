import { Order } from '@unchainedshop/types/orders.js';
import { OrderPayment } from '@unchainedshop/types/orders.payments.js';
import { IOrderPricingSheet } from '@unchainedshop/types/orders.pricing.js';
import Stripe from 'stripe';

const { STRIPE_SECRET, STRIPE_WEBHOOK_ENVIRONMENT, EMAIL_WEBSITE_NAME } = process.env;

const stripe = new Stripe(STRIPE_SECRET, {
  apiVersion: '2024-04-10',
});

const environment = STRIPE_WEBHOOK_ENVIRONMENT ?? null;

export default stripe;

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
  } catch (e) {
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
  const description = `${descriptorPrefix || EMAIL_WEBSITE_NAME || 'Unchained'} ${userId}${email ? ` (#${email})` : ''}`;

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
  const description = `${descriptorPrefix || EMAIL_WEBSITE_NAME || 'Unchained'} ${order._id}${order.orderNumber ? ` (#${order.orderNumber})` : ''}`;
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
