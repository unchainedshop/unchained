import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { getOrderCart } from '../utils/getOrderCart.js';

export default async function emptyCart(
  root: Root,
  { orderId }: { orderId?: string },
  context: Context,
) {
  const { modules, userId, user } = context;

  log('mutation emptyCart', { userId, orderId });

  const cart = await getOrderCart({ orderId, user }, context);
  if (!cart) return null;

  await modules.orders.positions.removePositions({ orderId: cart._id }, context);
  return modules.orders.findOrder({ orderId: cart._id });
}
