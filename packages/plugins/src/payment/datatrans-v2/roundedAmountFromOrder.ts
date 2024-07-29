import { UnchainedCore } from '@unchainedshop/types/core.js';
import { Order } from '@unchainedshop/core-orders';

const roundedAmountFromOrder = (
  order: Order,
  context: UnchainedCore,
): { currency: string; amount: number } => {
  const pricing = context.modules.orders.pricingSheet(order);
  const { currency, amount } = pricing.total({ useNetPrice: false });
  return {
    currency,
    amount: Math.round(amount),
  };
};

export default roundedAmountFromOrder;
