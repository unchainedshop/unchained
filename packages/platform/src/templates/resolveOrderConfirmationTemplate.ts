import { TemplateResolver } from '@unchainedshop/types/messaging.js';
import { getOrderPositionsData } from './utils/getOrderPositionsData.js';
import { getOrderSummaryData } from './utils/getOrderSummaryData.js';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME, EMAIL_WEBSITE_URL } = process.env;

const textTemplate = `
Thank you very much for your order.

Order number: {{orderNumber}}
Ordered: {{orderDate}}

Delivery address:
-----------------
{{summary.deliveryAddress}}

Billing address:
-----------------
{{summary.billingAddress}}

Articles:
-----------------
{{#positions}}
* {{quantity}} {{productTexts.title}}: {{total}}

{{/positions}}

Subtotal: {{summary.items}}
{{#summary.raw.delivery.amount}}
Delivery: {{summary.delivery}}
{{/summary.raw.delivery.amount}}
{{#summary.raw.payment.amount}}
Payment: {{summary.payment}}
{{/summary.raw.payment.amount}}
Total: {{summary.gross}}
{{#summary.raw.taxes.amount}}
(VAT included: {{summary.taxes}})
{{/summary.raw.taxes.amount}}
`;

export const resolveOrderConfirmationTemplate: TemplateResolver = async (
  { orderId, locale },
  context,
) => {
  const { modules } = context;
  const order = await modules.orders.findOrder({ orderId });

  if (order.status === 'PENDING') {
    return [];
  }

  const subject = `${EMAIL_WEBSITE_NAME}: Order confirmation`;

  const data = {
    shopName: EMAIL_WEBSITE_NAME,
    shopUrl: EMAIL_WEBSITE_URL,
    orderDate: new Date(order.ordered).toLocaleString(),
    orderNumber: order.orderNumber,
    currency: order.currency,
    summary: await getOrderSummaryData(order, { locale }, context),
    positions: await getOrderPositionsData(order, { locale }, context),
  };

  return [
    {
      type: 'EMAIL',
      input: {
        from: EMAIL_FROM || 'orders@unchained.local',
        to: order.contact.emailAddress,
        subject,
        text: modules.messaging.renderToText(textTemplate, data),
      },
    },
  ];
};
