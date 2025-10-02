import { User } from '@unchainedshop/core-users';
import { Modules } from '../modules.js';
import { nextUserCartService } from './nextUserCart.js';

export async function findOrInitCartService(
  this: Modules,
  {
    user,
    countryCode,
    orderId,
  }: {
    user: User;
    countryCode: string;
    orderId?: string;
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
  });
}
