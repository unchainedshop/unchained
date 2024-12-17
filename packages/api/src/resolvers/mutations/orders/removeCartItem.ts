import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { OrderItemNotFoundError, OrderWrongStatusError, InvalidIdError } from '../../../errors.js';

export default async function removeCartItem(
  root: never,
  { itemId }: { itemId: string },
  context: Context,
) {
  const { modules, services, userId } = context;

  log(`mutation removeCartItem ${itemId}`, { userId });

  if (!itemId) throw new InvalidIdError({ itemId });

  const orderItem = await modules.orders.positions.findOrderPosition({
    itemId,
  });
  if (!orderItem) throw new OrderItemNotFoundError({ orderItem });

  const order = await modules.orders.findOrder({ orderId: orderItem.orderId });

  if (!modules.orders.isCart(order)) {
    throw new OrderWrongStatusError({ status: order.status });
  }

  const removedOrderPosition = await modules.orders.positions.delete(itemId);
  await services.orders.updateCalculation(order._id);
  return removedOrderPosition;
}
