import { TemplateResolver } from '@unchainedshop/core';
import { transformOrderToText } from './order-parser/index.js';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME, EMAIL_WEBSITE_URL } = process.env;

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

  const orderDetails = await transformOrderToText({ order, locale: new Intl.Locale(locale) }, context);

  const text = `
Thank you very much for your order.

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
