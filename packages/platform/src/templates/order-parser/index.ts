import { getOrderPositionsData } from './getOrderPositionsData.js';
import { getOrderSummaryData } from './getOrderSummaryData.js';
import { Order } from '@unchainedshop/core-orders';
import { UnchainedCore } from '@unchainedshop/core';

export const transformOrderToText = async (
  { order, locale }: { order: Order; locale: Intl.Locale },
  context: UnchainedCore,
) => {
  const orderDate = new Date(order.ordered!).toLocaleString();
  const orderNumber = order.orderNumber;
  const summary = await getOrderSummaryData(order, { locale }, context);
  const positions = await getOrderPositionsData(order, { locale }, context);

  const positionsText = positions
    .map((pos) => `* ${pos.quantity} ${pos.productTexts.title}: ${pos.total}`)
    .join('\n');

  const deliveryFeesText = summary.rawPrices.delivery.amount
    ? `Delivery Fees: ${summary.prices.delivery}\n`
    : '';
  const paymentFeesText = summary.rawPrices.payment.amount
    ? `Payment Fees: ${summary.prices.payment}\n`
    : '';
  const taxesText = summary.rawPrices.taxes.amount ? `(VAT included: ${summary.prices.taxes})` : '';

  return `Order number: ${orderNumber}
Ordered: ${orderDate}
Payment method: ${summary.payment}
Delivery method: ${summary.delivery}

Delivery address:
${summary.deliveryAddress}

Billing address:
${summary.billingAddress}

Order Details:

Items:
${positionsText}

${deliveryFeesText}${paymentFeesText}Total: ${summary.prices.gross}
${taxesText}
`;
};

export { getOrderPositionsData, getOrderSummaryData };
