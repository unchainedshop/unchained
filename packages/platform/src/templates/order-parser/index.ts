import { getOrderPositionsData } from './getOrderPositionsData.js';
import { getOrderSummaryData } from './getOrderSummaryData.js';
import { Order } from '@unchainedshop/core-orders';
import { UnchainedCore } from '@unchainedshop/core';

import mustache from 'mustache';

const textTemplate = `Order number: {{orderNumber}}
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

export const transformOrderToText = async (
  { order, locale }: { order: Order; locale: string },
  context: UnchainedCore,
) => {
  return mustache.render(
    textTemplate,
    {
      orderDate: new Date(order.ordered).toLocaleString(),
      orderNumber: order.orderNumber,
      summary: await getOrderSummaryData(order, { locale }, context),
      positions: await getOrderPositionsData(order, { locale }, context),
    },
    undefined,
    { escape: (t) => t },
  );
};

export { getOrderPositionsData, getOrderSummaryData };
