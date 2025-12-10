import type { TemplateResolver } from '@unchainedshop/core';
import { systemLocale } from '@unchainedshop/utils';
import { transformOrderToText } from './order-parser/index.ts';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME, EMAIL_WEBSITE_URL } = process.env;

export const resolveForwardDeliveryTemplate: TemplateResolver = async ({ config, orderId }, context) => {
  const { modules } = context;
  const order = await modules.orders.findOrder({ orderId });

  const configObject = config.reduce((acc, { key, value }) => {
    return {
      ...acc,
      [key]: value,
    };
  }, {});

  const subject = `${EMAIL_WEBSITE_NAME} Order ${order.orderNumber}`;

  const orderDetails = await transformOrderToText({ order, locale: systemLocale }, context);

  const text = `
New Order received:

${orderDetails}

${EMAIL_WEBSITE_NAME}: ${EMAIL_WEBSITE_URL}
`;

  return [
    {
      type: 'EMAIL',
      input: {
        from: `${EMAIL_WEBSITE_NAME} <${configObject.from || EMAIL_FROM || 'noreply@unchained.local'}>`,
        to: configObject.to || 'orders@unchained.local',
        cc: configObject.cc,
        subject,
        text,
      },
    },
  ];
};
