import { OrderPricingSheet } from '@unchainedshop/core';
import { OrderStatus, type Order } from '@unchainedshop/core-orders';
import { acpConfig } from './config.ts';

export const acpOrderStatus = (order: Order) => {
  if ((order.context as any)?.acp?.canceled || order.status === OrderStatus.REJECTED) {
    return 'canceled';
  }
  if (order.status === OrderStatus.FULFILLED) return 'completed';
  if (order.status === OrderStatus.CONFIRMED) return 'confirmed';
  if (order.status === OrderStatus.PENDING) return 'processing';
  return 'created';
};

export const acpOrderPermalink = (order: Order) => {
  const permalinkBase = acpConfig.continueUrl?.replace(/\/$/, '');
  if (!permalinkBase) {
    throw new Error('ACP_CHECKOUT_CONTINUE_URL is not configured');
  }
  return `${permalinkBase}/${order.orderNumber || order._id}`;
};

export const serializeACPOrder = (order: Order) => {
  const pricing = OrderPricingSheet({
    calculation: order.calculation,
    currencyCode: order.currencyCode,
  });
  return {
    type: 'order',
    id: order._id,
    checkout_session_id: order._id,
    order_number: order.orderNumber,
    permalink_url: acpOrderPermalink(order),
    status: acpOrderStatus(order),
    totals: [
      {
        type: 'total',
        display_text: 'Total',
        amount: pricing.total({ useNetPrice: false }).amount,
      },
    ],
  };
};
