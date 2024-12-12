import { TemplateResolver } from '@unchainedshop/core';
import { systemLocale } from '@unchainedshop/utils';
import { transformOrderToText } from './order-parser/index.js';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME, EMAIL_WEBSITE_URL } = process.env;

const textTemplate = `
New Order received:

{{orderDetails}}

{{shopName}}: {{shopUrl}}
`;

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

  const data = {
    shopName: EMAIL_WEBSITE_NAME,
    shopUrl: EMAIL_WEBSITE_URL,
    orderDetails: await transformOrderToText({ order, locale: systemLocale.baseName }, context),
  };

  return [
    {
      type: 'EMAIL',
      input: {
        from: `${EMAIL_WEBSITE_NAME} <${configObject.from || EMAIL_FROM || 'noreply@unchained.local'}>`,
        to: configObject.to || 'orders@unchained.local',
        cc: configObject.cc,
        subject,
        text: modules.messaging.renderToText(textTemplate, data),
      },
    },
  ];
};
