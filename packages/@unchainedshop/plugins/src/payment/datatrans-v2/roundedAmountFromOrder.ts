import { Context } from '@unchainedshop/types/api';
import { Order } from '@unchainedshop/types/orders';

const roundedAmountFromOrder = (
  order: Order,
  context: Context,
): { currency: string; amount: number } => {
  const pricing = context.modules.orders.pricingSheet(order);
  const { currency, amount } = pricing.total({ useNetPrice: false });
  return {
    currency,
    amount: Math.round(amount),
  };
};

export default roundedAmountFromOrder;
