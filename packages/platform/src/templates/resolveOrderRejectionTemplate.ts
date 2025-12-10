import type { TemplateResolver } from '@unchainedshop/core';
import { transformOrderToText } from './order-parser/index.ts';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME, EMAIL_WEBSITE_URL } = process.env;

export const resolveOrderRejectionTemplate: TemplateResolver = async ({ orderId, locale }, context) => {
  const { modules } = context;
  const order = await modules.orders.findOrder({ orderId });

  if (order.status !== 'REJECTED') {
    return [];
  }

  const subject = `Order rejected ${order.orderNumber}`;

  const orderDetails = await transformOrderToText({ order, locale: new Intl.Locale(locale) }, context);

  const text = `
I'm sorry we can't confirm your order.

This can happen when the payment was not successful or the order was manually canceled because of product availability or fullfillment issues.

The order in question is:

${orderDetails}

${EMAIL_WEBSITE_NAME}: ${EMAIL_WEBSITE_URL}
`;

  return [
    {
      type: 'EMAIL',
      input: {
        from: `${EMAIL_WEBSITE_NAME} <${EMAIL_FROM || 'noreply@unchained.local'}>`,
        to: order.contact.emailAddress,
        subject,
        text,
      },
    },
  ];
};
