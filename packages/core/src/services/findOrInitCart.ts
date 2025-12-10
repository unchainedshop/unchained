import type { User } from '@unchainedshop/core-users';
import type { Modules } from '../modules.ts';
import { nextUserCartService } from './nextUserCart.ts';

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
