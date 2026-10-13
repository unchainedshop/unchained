import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { lockCart } from '../../loadCart.ts';

export default async function emptyCart(
  root: never,
  { orderId }: { orderId?: string },
  context: Context,
) {
  const { modules, services, userId } = context;

  log('mutation emptyCart', { userId, orderId });

  await using order = await lockCart(context, orderId);

  await modules.orders.positions.removePositions({ orderId: order._id });

  return await services.orders.updateCalculation(order._id);
}
