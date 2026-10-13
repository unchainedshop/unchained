import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import loadCart from './loadCart.ts';

export default async function emptyCart(
  root: never,
  { orderId }: { orderId?: string },
  context: Context,
) {
  const { modules, services, userId } = context;

  log('mutation emptyCart', { userId, orderId });

  const order = await loadCart(context, orderId);

  await modules.orders.positions.removePositions({ orderId: order._id });

  return services.orders.updateCalculation(order._id);
}
