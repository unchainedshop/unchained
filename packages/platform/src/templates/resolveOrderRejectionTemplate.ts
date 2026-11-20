import type { TemplateResolver } from '@unchainedshop/core';
import { orderEmail } from './orderEmail.ts';

export const resolveOrderRejectionTemplate: TemplateResolver = async ({ orderId, locale }, context) => {
  const order = await context.modules.orders.findOrder({ orderId });
  if (order.status !== 'REJECTED') return [];
  return orderEmail(order, new Intl.Locale(locale), context, {
    subject: `Order rejected ${order.orderNumber}`,
    to: order.contact.emailAddress,
    text: `I'm sorry we can't confirm your order.

This can happen when the payment was not successful or the order was manually canceled because of product availability or fulfillment issues.

The order in question is:`,
  });
};
