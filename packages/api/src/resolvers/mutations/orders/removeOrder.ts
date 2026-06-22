import { log } from '@unchainedshop/logger';
import { OrderNotFoundError, OrderWrongStatusError, InvalidIdError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function removeOrder(
  root: never,
  { orderId }: { orderId: string },
  { modules, services, userId }: Context,
) {
  log('mutation removeOrder', { userId, orderId });

  if (!orderId) throw new InvalidIdError({ orderId });

  const order = await modules.orders.findOrder({ orderId });
  if (!order) throw new OrderNotFoundError({ orderId });

  if (!modules.orders.isCart(order)) {
    throw new OrderWrongStatusError({ status: order.status });
  }

  // Cascade so the cart's positions/payments/deliveries/discounts don't get orphaned.
  await services.orders.deleteCart(orderId);

  return order;
}
