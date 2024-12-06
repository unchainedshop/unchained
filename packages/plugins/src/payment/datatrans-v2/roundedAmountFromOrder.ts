import { Order, OrderPricingSheet } from '@unchainedshop/core-orders';

const roundedAmountFromOrder = (order: Order): { currency: string; amount: number } => {
  const pricing = OrderPricingSheet({
    calculation: order.calculation,
    currency: order.currency,
  });
  const { currency, amount } = pricing.total({ useNetPrice: false });
  return {
    currency,
    amount: Math.round(amount),
  };
};

export default roundedAmountFromOrder;
