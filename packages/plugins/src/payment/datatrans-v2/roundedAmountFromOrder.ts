import { OrderPricingSheet } from '@unchainedshop/core';
import type { Order } from '@unchainedshop/core-orders';

const roundedAmountFromOrder = (order: Order): { currencyCode: string; amount: number } => {
  const pricing = OrderPricingSheet({
    calculation: order.calculation,
    currencyCode: order.currencyCode,
  });
  const { currencyCode, amount } = pricing.total({ useNetPrice: false });
  return {
    currencyCode,
    amount: Math.round(amount),
  };
};

export default roundedAmountFromOrder;
