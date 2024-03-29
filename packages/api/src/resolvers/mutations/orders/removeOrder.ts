import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';
import { OrderNotFoundError, OrderWrongStatusError, InvalidIdError } from '../../../errors.js';

export default async function removeOrder(
  root: Root,
  { orderId }: { orderId: string },
  { modules, userId }: Context,
) {
  log('mutation removeOrder', { userId, orderId });

  if (!orderId) throw new InvalidIdError({ orderId });

  const order = await modules.orders.findOrder({ orderId });
  if (!order) throw new OrderNotFoundError({ orderId });

  if (!modules.orders.isCart(order)) {
    throw new OrderWrongStatusError({ status: order.status });
  }

  await modules.orders.delete(orderId);

  return order;
}
