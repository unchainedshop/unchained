import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { OrderNotFoundError, OrderWrongStatusError } from '../../../errors.js';

export default async function emptyCart(
  root: never,
  { orderId }: { orderId?: string },
  context: Context,
) {
  const { modules, services, userId, user } = context;

  log('mutation emptyCart', { userId, orderId });

  const order = await services.orders.cart({ orderId, user });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  if (!order) return null;

  await modules.orders.positions.removePositions({ orderId: order._id });

  return services.orders.updateCalculation(order._id);
}
