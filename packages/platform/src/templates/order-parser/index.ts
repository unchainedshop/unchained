import { getOrderPositionsData } from './getOrderPositionsData.ts';
import { getOrderSummaryData } from './getOrderSummaryData.ts';
import { getOrderPriceFormatter } from './getOrderPriceFormatter.ts';
import type { Order } from '@unchainedshop/core-orders';
import type { UnchainedCore } from '@unchainedshop/core';

export const transformOrderToText = async (
  { order, locale }: { order: Order; locale: Intl.Locale },
  context: UnchainedCore,
) => {
  const orderDate = new Date(order.ordered!).toLocaleString();
  const orderNumber = order.orderNumber;
  const format = await getOrderPriceFormatter(order.currencyCode, { locale }, context);
  const summary = await getOrderSummaryData(order, { locale, format }, context);
  const positions = await getOrderPositionsData(order, { locale, format }, context);

  const positionsText = positions
    .map((pos) => `  ${pos.quantity}x ${pos.productTexts.title} ${pos.total}`)
    .join('\n');

  const priceLine = (label: string, key: 'items' | 'delivery' | 'payment') =>
    summary.rawPrices[key].amount ? `  ${label} ${summary.prices[key]}\n` : '';
  const breakdown =
    priceLine('Subtotal', 'items') + priceLine('Delivery', 'delivery') + priceLine('Payment', 'payment');
  const totalLine = `  ${'─'.repeat(50)}\n  Order Total ${summary.prices.gross}`;
  const taxesText = summary.rawPrices.taxes.amount ? `\n  (incl. VAT ${summary.prices.taxes})` : '';

  return `═════════════════════════════════════════════════════
ORDER CONFIRMATION
═════════════════════════════════════════════════════

Order Number:    ${orderNumber}
Order Date:      ${orderDate}

─────────────────────────────────────────────────────
DELIVERY INFORMATION
─────────────────────────────────────────────────────

Delivery Method: ${summary.delivery}

Delivery Address:
${summary.deliveryAddress}

─────────────────────────────────────────────────────
PAYMENT INFORMATION
─────────────────────────────────────────────────────

Payment Method:  ${summary.payment}

Billing Address:
${summary.billingAddress}

─────────────────────────────────────────────────────
ORDER DETAILS
─────────────────────────────────────────────────────

${positionsText}

${breakdown}${totalLine}${taxesText}
═════════════════════════════════════════════════════
`;
};

export { getOrderPositionsData, getOrderSummaryData };
