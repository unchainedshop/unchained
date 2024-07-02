import { Order } from '@unchainedshop/types/orders.js';
import { OrderPayment } from '@unchainedshop/types/orders.payments.js';
import { IOrderPricingSheet, OrderPricingCalculation } from '@unchainedshop/types/orders.pricing.js';
import Stripe from 'stripe';

const { STRIPE_SECRET, STRIPE_WEBHOOK_ENVIRONMENT, EMAIL_WEBSITE_NAME } = process.env;

const stripe = new Stripe(STRIPE_SECRET, {
  apiVersion: '2024-04-10',
});

export default stripe;

export const upsertCustomer = async ({ userId, name, email }) => {
  try {
    const { data } = await stripe.customers.search({ query: `metadata["userId"]:"${userId}"` });
    const existingCustomer = data[0];
    const environment = STRIPE_WEBHOOK_ENVIRONMENT ?? null;

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
      return updatedCustomer;
    }

    return existingCustomer;
  } catch (e) {
    const customer = await stripe.customers.create({
      metadata: {
        userId,
        environment: STRIPE_WEBHOOK_ENVIRONMENT ?? null,
      },
      name,
      email,
    });
    return customer;
  }
};

export const createRegistrationIntent = async (
  { userId, name, email, paymentProviderId },
  options = {},
) => {
  const customer = await upsertCustomer({ userId, name, email });
  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
    metadata: {
      userId,
      paymentProviderId,
      environment: STRIPE_WEBHOOK_ENVIRONMENT ?? null,
    },
    usage: 'off_session',
    ...options,
  });
  return setupIntent;
};

export const createOrderPaymentIntent = async (
  {
    order,
    orderPayment,
    pricing,
  }: { order: Order; orderPayment: OrderPayment; pricing: IOrderPricingSheet },
  options = {},
) => {
  const name =
    [order.billingAddress?.firstName, order.billingAddress?.lastName].filter(Boolean).join(' ') ||
    order.billingAddress?.company;

  const customer = await upsertCustomer({
    userId: order.userId,
    name,
    email: order.contact?.emailAddress,
  });

  const reference = EMAIL_WEBSITE_NAME || 'Unchained';
  const { currency, amount } = pricing.total({ useNetPrice: false });
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount),
    currency: currency.toLowerCase(),
    description: `${reference}${STRIPE_WEBHOOK_ENVIRONMENT ? ` (${STRIPE_WEBHOOK_ENVIRONMENT})` : ''}: ${order._id}${order.orderNumber ? ` (#${order.orderNumber})` : ''}`,
    statement_descriptor_suffix: order._id,
    setup_future_usage: 'off_session', // Verify your integration in this guide by including this parameter
    customer: customer.id,
    metadata: {
      orderPaymentId: orderPayment._id,
      environment: STRIPE_WEBHOOK_ENVIRONMENT ?? null,
    },
    ...options,
  });
  return paymentIntent;
};
