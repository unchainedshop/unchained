import { slugify } from '@unchainedshop/utils';
import Stripe from 'stripe';

const { STRIPE_SECRET, STRIPE_WEBHOOK_ENVIRONMENT, EMAIL_WEBSITE_NAME } = process.env;

const stripe = new Stripe(STRIPE_SECRET, {
  apiVersion: '2024-04-10',
});

export default stripe;

export const createRegistrationIntent = async (
  { userId, name, email, paymentProviderId },
  options = {},
) => {
  const customer = await stripe.customers.create({
    metadata: {
      userId,
      environment: STRIPE_WEBHOOK_ENVIRONMENT ?? null,
    },
    name,
    email,
  });
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

export const createOrderPaymentIntent = async ({ order, orderPayment, pricing }, options = {}) => {
  const reference = EMAIL_WEBSITE_NAME || order._id;
  const { currency, amount } = pricing.total({ useNetPrice: false });
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount),
    currency: currency.toLowerCase(),
    description: `${reference}`,
    statement_descriptor_suffix: slugify(reference),
    receipt_email: order.contact?.emailAddress,
    setup_future_usage: 'off_session', // Verify your integration in this guide by including this parameter
    metadata: {
      orderPaymentId: orderPayment._id,
      environment: STRIPE_WEBHOOK_ENVIRONMENT ?? null,
    },
    ...options,
  });
  return paymentIntent;
};
