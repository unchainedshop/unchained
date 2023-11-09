import { TemplateResolver } from '@unchainedshop/types/messaging.js';
import { systemLocale } from '@unchainedshop/utils';
import { getOrderPositionsData } from './utils/getOrderPositionsData.js';
import { getOrderSummaryData } from './utils/getOrderSummaryData.js';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME, EMAIL_WEBSITE_URL } = process.env;

const textTemplate = `
New Order:

Order number: {{orderNumber}}
Ordered: {{orderDate}}
Payment method: {{summary.payment}}
Delivery method: {{summary.delivery}}

Delivery address:
{{summary.deliveryAddress}}

Billing address:
{{summary.billingAddress}}

Order Details:

Items:
{{#positions}}
* {{quantity}} {{productTexts.title}}: {{total}}
{{/positions}}

{{#summary.rawPrices.delivery.amount}}
Delivery Fees: {{summary.prices.delivery}}
{{/summary.rawPrices.delivery.amount}}
{{#summary.rawPrices.payment.amount}}
Payment Fees: {{summary.prices.payment}}
{{/summary.rawPrices.payment.amount}}
Total: {{summary.prices.gross}}
{{#summary.rawPrices.taxes.amount}}
(VAT included: {{summary.prices.taxes}})
{{/summary.rawPrices.taxes.amount}}
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

  const subject = `${EMAIL_WEBSITE_NAME}: New Order / ${order.orderNumber}`;

  const data = {
    shopName: EMAIL_WEBSITE_NAME,
    shopUrl: EMAIL_WEBSITE_URL,
    orderDate: new Date(order.ordered).toLocaleString(),
    orderNumber: order.orderNumber,
    currency: order.currency,
    positions: await getOrderPositionsData(order, { locale: systemLocale }, context),
    summary: await getOrderSummaryData(order, { locale: systemLocale }, context),
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
      },
    },
  ];
};
