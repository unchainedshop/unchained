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

  const orderItem = await modules.orders.positions.findOrderPosition({
    itemId,
  });
  if (!orderItem) throw new OrderItemNotFoundError({ orderItem });

  await using order = await lockCart(context, orderItem.orderId);

  const removedOrderPosition = await modules.orders.positions.delete(itemId);
  await services.orders.updateCalculation(order._id);
  return removedOrderPosition;
}
