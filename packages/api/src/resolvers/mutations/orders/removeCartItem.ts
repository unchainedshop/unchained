import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { OrderItemNotFoundError, InvalidIdError } from '../../../errors.ts';
import { lockCart } from '../../loadCart.ts';

export default async function removeCartItem(
  root: never,
  { itemId }: { itemId: string },
  context: Context,
) {
  const { modules, services, userId } = context;

  log(`mutation removeCartItem ${itemId}`, { userId });

  if (!itemId) throw new InvalidIdError({ itemId });

  const position = await modules.orders.positions.findOrderPosition({ itemId });
  if (!position) throw new OrderItemNotFoundError({ itemId });

  await using order = await lockCart(context, position.orderId);
  const orderItem = await modules.orders.positions.findOrderPosition({ itemId });
  if (orderItem?.orderId !== order._id) throw new OrderItemNotFoundError({ itemId });

  const removedOrderPosition = await modules.orders.positions.delete(itemId);
  await services.orders.updateCalculation(order._id);
  return removedOrderPosition;
}
