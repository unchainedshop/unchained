import type { TemplateResolver } from '@unchainedshop/core';
import { orderEmail } from './orderEmail.ts';

export const resolveOrderConfirmationTemplate: TemplateResolver<{
  orderId: string;
  locale: string;
}> = async ({ orderId, locale }, context) => {
  const order = await context.modules.orders.findOrder({ orderId });
  if (order.status === 'PENDING') return [];
  return orderEmail(order, new Intl.Locale(locale), context, {
    subject: `Order ${order.orderNumber}`,
    to: order.contact.emailAddress,
    text: 'Thank you very much for your order.',
  });
};
