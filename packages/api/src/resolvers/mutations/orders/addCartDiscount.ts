import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { getOrderCart } from '../utils/getOrderCart.js';
import { OrderWrongStatusError } from '../../../errors.js';

export default async function addCartDiscount(
  root: never,
  { orderId, code }: { orderId?: string; code: string },
  context: Context,
) {
  const { modules, user, userId } = context;

  log(`mutation addCartDiscount ${code} ${orderId}`, { userId, orderId });

  const order = await getOrderCart({ orderId, user }, context);

  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  const discount = await modules.orders.discounts.createManualOrderDiscount({ order, code }, context);
  await modules.orders.updateCalculation(order._id, context);
  return discount;
}
