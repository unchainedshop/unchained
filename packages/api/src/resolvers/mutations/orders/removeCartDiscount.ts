import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

import { OrderDiscountNotFoundError, OrderWrongStatusError, InvalidIdError } from '../../../errors.js';

export default async function removeCartDiscount(
  root: Root,
  { discountId }: { discountId: string },
  context: Context,
) {
  const { modules, userId } = context;

  log(`mutation removeCartDiscount ${discountId}`, { userId });

  if (!discountId) throw new InvalidIdError({ discountId });

  const orderDiscount = await modules.orders.discounts.findOrderDiscount({
    discountId,
  });
  if (!orderDiscount) throw new OrderDiscountNotFoundError({ orderDiscount });

  const order = await modules.orders.findOrder({
    orderId: orderDiscount.orderId,
  });
  if (!modules.orders.isCart(order)) {
    throw new OrderWrongStatusError({ status: order.status });
  }

  const deletedDiscount = await modules.orders.discounts.delete(discountId, context);
  await modules.orders.updateCalculation(order._id, context);
  return deletedDiscount;
}
