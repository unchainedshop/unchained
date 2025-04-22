import { TemplateResolver } from '@unchainedshop/core';
import { transformOrderToText } from './order-parser/index.js';
import mustache from 'mustache';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME, EMAIL_WEBSITE_URL } = process.env;

const textTemplate = `
Thank you very much for your order.

{{orderDetails}}

{{shopName}}: {{shopUrl}}
`;

export const resolveOrderConfirmationTemplate: TemplateResolver<{
  orderId: string;
  locale: string;
}> = async ({ orderId, locale }, context) => {
  const { modules } = context;
  const order = await modules.orders.findOrder({ orderId });

  if (order.status === 'PENDING') {
    return [];
  }

  const subject = `Order ${order.orderNumber}`;

  const text = mustache.render(
    textTemplate,
    {
      shopName: EMAIL_WEBSITE_NAME,
      shopUrl: EMAIL_WEBSITE_URL,
      orderDetails: await transformOrderToText({ order, locale: new Intl.Locale(locale) }, context),
    },
    undefined,
    { escape: (t) => t },
  );

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
