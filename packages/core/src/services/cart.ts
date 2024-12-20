import { User } from '@unchainedshop/core-users';
import { Order } from '@unchainedshop/core-orders';
import { Modules } from '../modules.js';
import { nextUserCartService } from './nextUserCart.js';

export async function cartService(
  this: Modules,
  {
    user,
    countryCode,
    orderId,
  }: {
    user: User;
    orderId?: string;
    countryCode?: string;
  },
) {
  if (orderId) {
    const order = await this.orders.findOrder({ orderId });
    if (!order) return null;
    return order;
  }

  return nextUserCartService.bind(this)({
    user,
    countryCode,
    forceCartCreation: true,
  }) as Order;
}
