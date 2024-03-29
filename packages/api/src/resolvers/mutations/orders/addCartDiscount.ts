import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';
import { getOrderCart } from '../utils/getOrderCart.js';

export default async function addCartDiscount(
  root: Root,
  { orderId, code }: { orderId?: string; code: string },
  context: Context,
) {
  const { modules, user, userId } = context;

  log(`mutation addCartDiscount ${code} ${orderId}`, { userId, orderId });

  const cart = await getOrderCart({ orderId, user }, context);

  return modules.orders.discounts.createManualOrderDiscount({ order: cart, code }, context);
}
