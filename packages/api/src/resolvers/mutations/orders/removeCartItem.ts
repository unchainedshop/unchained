import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { OrderItemNotFoundError, OrderWrongStatusError, InvalidIdError } from '../../../errors.js';

export default async function removeCartItem(
  root: Root,
  { itemId }: { itemId: string },
  context: Context,
) {
  const { modules, userId } = context;

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

  const removedOrderPosition = await modules.orders.positions.delete(itemId, context);
  await modules.orders.updateCalculation(order._id, context);
  return removedOrderPosition;
}
