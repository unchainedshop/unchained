import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import {
  OrderItemNotFoundError,
  OrderWrongStatusError,
  InvalidIdError,
} from '../../../errors';

export default async function removeCartItem(
  root: Root,
  { itemId }: { itemId: string },
  { modules, userId }: Context
) {
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

  return await modules.orders.positions.delete(itemId, userId);
}
