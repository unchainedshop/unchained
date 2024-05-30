import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { getOrderCart } from '../utils/getOrderCart.js';
import { OrderWrongStatusError } from '../../../errors.js';

export default async function emptyCart(
  root: Root,
  { orderId }: { orderId?: string },
  context: Context,
) {
  const { modules, userId, user } = context;

  log('mutation emptyCart', { userId, orderId });

  const order = await getOrderCart({ orderId, user }, context);
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  if (!order) return null;

  await modules.orders.positions.removePositions({ orderId: order._id }, context);
  return modules.orders.findOrder({ orderId: order._id });
}
