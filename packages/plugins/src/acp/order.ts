import { OrderPricingSheet } from '@unchainedshop/core';
import { OrderStatus, type Order } from '@unchainedshop/core-orders';
import { acpConfig } from './config.ts';

export const acpContextOf = (order: Order) =>
  (order.context as { acp?: Record<string, unknown> } | undefined)?.acp;

export const isACPCanceled = (order: Order) => Boolean(acpContextOf(order)?.canceled);

export const isACPAuthenticationRequired = (order: Order) =>
  Boolean(acpContextOf(order)?.authenticationRequired);

export const acpOrderStatus = (order: Order) => {
  if (isACPCanceled(order) || order.status === OrderStatus.REJECTED) return 'canceled';
  if (order.status === OrderStatus.FULFILLED) return 'completed';
  if (order.status === OrderStatus.CONFIRMED) return 'confirmed';
  return 'created';
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
    permalink_url: `${acpConfig.continueUrl}/${order.orderNumber || order._id}`,
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
