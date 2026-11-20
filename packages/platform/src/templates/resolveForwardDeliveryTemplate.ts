import type { TemplateResolver } from '@unchainedshop/core';
import { systemLocale } from '@unchainedshop/utils';
import { orderEmail } from './orderEmail.ts';

const { EMAIL_WEBSITE_NAME } = process.env;

export const resolveForwardDeliveryTemplate: TemplateResolver = async ({ config, orderId }, context) => {
  const order = await context.modules.orders.findOrder({ orderId });
  const { from, to, cc } = Object.fromEntries(config.map(({ key, value }) => [key, value]));
  return orderEmail(order, systemLocale, context, {
    from,
    to: to || 'orders@unchained.local',
    cc,
    subject: `${EMAIL_WEBSITE_NAME} Order ${order.orderNumber}`,
    text: 'New Order received:',
  });
};
