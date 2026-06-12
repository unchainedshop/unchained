import type { IOrderPricingSheet } from '@unchainedshop/core';
import type { Order, OrderPayment } from '@unchainedshop/core-orders';
import type { Stripe } from 'stripe';
import { stripeEnvironment } from './stripe.ts';

export type StripeOrderPaymentMetadata = Record<string, string | null> & {
  orderPaymentId: string;
  orderId: string;
  userId: string;
  environment: string | null;
};

export const buildStatementDescriptorSuffix = (orderId: string) =>
  `${orderId.substring(0, 4)}..${orderId.substring(orderId.length - 4)}`;

export const buildOrderPaymentMetadata = ({
  order,
  orderPayment,
  userId = order.userId,
}: {
  order: Order;
  orderPayment: OrderPayment;
  userId?: string;
}): StripeOrderPaymentMetadata => ({
  orderPaymentId: orderPayment._id,
  orderId: order._id,
  userId,
  environment: stripeEnvironment,
});

export const resolveStripePaymentTotal = (pricing: IOrderPricingSheet) => {
  const { currencyCode, amount } = pricing.total({ useNetPrice: false });
  return {
    amount: Math.round(amount),
    currency: currencyCode.toLowerCase(),
  };
};

export const assertPaymentIntentMatchesOrderPayment = ({
  paymentIntent,
  orderPayment,
  pricing,
}: {
  paymentIntent: Stripe.PaymentIntent;
  orderPayment: OrderPayment;
  pricing: IOrderPricingSheet;
}) => {
  const { amount, currency } = resolveStripePaymentTotal(pricing);

  if (paymentIntent.currency !== currency || paymentIntent.amount !== amount) {
    throw new Error('The price has changed since the intent has been created');
  }
  if (paymentIntent.metadata?.orderPaymentId !== orderPayment._id) {
    throw new Error('The order payment is different from the initiating intent');
  }
};
