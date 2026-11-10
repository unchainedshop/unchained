import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';
import { lockCart } from '../../loadCart.ts';

export default async function removeOrder(
  root: never,
  { orderId }: { orderId: string },
  context: Context,
) {
  const { services, userId } = context;

  log('mutation removeOrder', { userId, orderId });

  if (!orderId) throw new InvalidIdError({ orderId });

  await using order = await lockCart(context, orderId);

  // Cascade so the cart's positions/payments/deliveries/discounts don't get orphaned.
  await services.orders.deleteCart(orderId);

  return order;
}
