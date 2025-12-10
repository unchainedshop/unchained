import { getOrderPositionsData } from './getOrderPositionsData.ts';
import { getOrderSummaryData } from './getOrderSummaryData.ts';
import type { Order } from '@unchainedshop/core-orders';
import type { UnchainedCore } from '@unchainedshop/core';

export const transformOrderToText = async (
  { order, locale }: { order: Order; locale: Intl.Locale },
  context: UnchainedCore,
) => {
  const orderDate = new Date(order.ordered!).toLocaleString();
  const orderNumber = order.orderNumber;
  const summary = await getOrderSummaryData(order, { locale }, context);
  const positions = await getOrderPositionsData(order, { locale }, context);

  const positionsText = positions
    .map((pos) => `  ${pos.quantity}x ${pos.productTexts.title} ${pos.total}`)
    .join('\n');

  const subtotalText = summary.rawPrices.items.amount ? `  Subtotal ${summary.prices.items}\n` : '';
  const deliveryFeesText = summary.rawPrices.delivery.amount
    ? `  Delivery ${summary.prices.delivery}\n`
    : '';
  const paymentFeesText = summary.rawPrices.payment.amount
    ? `  Payment ${summary.prices.payment}\n`
    : '';
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

${subtotalText}${deliveryFeesText}${paymentFeesText}${totalLine}${taxesText}
═════════════════════════════════════════════════════
`;
};

export { getOrderPositionsData, getOrderSummaryData };
