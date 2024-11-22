import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { getOrderCart } from '../utils/getOrderCart.js';
import { OrderWrongStatusError } from '../../../errors.js';

export default async function emptyCart(
  root: never,
  { orderId }: { orderId?: string },
  context: Context,
) {
  const { modules, userId, user } = context;

  log('mutation emptyCart', { userId, orderId });

  const order = await getOrderCart({ orderId, user }, context);
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  if (!order) return null;

  await modules.orders.positions.removePositions({ orderId: order._id });
  return modules.orders.updateCalculation(order._id, context);
}
