import { TemplateResolver } from '@unchainedshop/types/messaging.js';
import { systemLocale } from '@unchainedshop/utils';
import { getOrderAttachmentsData } from './utils/getOrderAttachmentsData.js';
import { getOrderPositionsData } from './utils/getOrderPositionsData.js';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME, ROOT_URL } = process.env;

const textTemplate = `
  {{subject}}\n
  \n
  Order number: {{orderNumber}}\n
  Order date: {{orderDate}}\n
  Link: {{adminUILink}}\n
  \n
  Delivery address:\n
  -----------------\n
  {{address.firstName}} {{address.lastName}}\n
  {{address.company}}\n
  {{address.addressLine}}\n
  {{address.addressLine2}}\n
  {{address.postalCode}} {{address.city}}\n
  {{address.regionCode}}\n
  {{address.countryCode}}\n
  \n
  Articles:\n
  -----------------\n
  {{#items}}
  * {{sku}} - {{name}}      CHF {{price}}     {{quantity}}\n
  {{/items}}
`;

export const resolveForwardDeliveryTemplate: TemplateResolver = async ({ config, orderId }, context) => {
  const { modules } = context;
  const order = await modules.orders.findOrder({ orderId });
  const orderPricing = modules.orders.pricingSheet(order);

  const orderDate = new Date(order.ordered).toLocaleString();

  const attachments = await getOrderAttachmentsData(order, { fileType: 'DELIVERY_NOTE' }, context);

  const address = order.billingAddress;
  const configObject = config.reduce((acc, { key, value }) => {
    return {
      ...acc,
      [key]: value,
    };
  }, {});

  const subject = `${EMAIL_WEBSITE_NAME}: New Order / ${order.orderNumber}`;

  const adminUILink = `${ROOT_URL}/orders/view/?_id=${order._id}`;

  const data = {
    contact: order.contact || {},
    adminUILink,
    items: getOrderPositionsData(order, { locale: systemLocale }, context),
    orderDate,
    orderNumber: order.orderNumber,
    shopName: EMAIL_WEBSITE_NAME,
    subject,
    total: orderPricing.total({ useNetPrice: false }).amount / 100,
    ...configObject,
    address,
  };

  return [
    {
      type: 'EMAIL',
      input: {
        from: configObject.from || EMAIL_FROM || 'noreply@unchained.local',
        to: configObject.to || 'orders@unchained.local',
        cc: configObject.cc,
        subject,
        text: modules.messaging.renderToText(textTemplate, data),
        attachments,
      },
    },
  ];
};
