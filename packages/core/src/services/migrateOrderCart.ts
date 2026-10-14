import { updateCalculationService } from './updateCalculation.ts';
import type { Modules } from '../modules.ts';

export async function migrateOrderCartsService(
  this: Modules,
  {
    fromUserId,
    toUserId,
    shouldMerge,
    countryCode,
  }: {
    fromUserId: string;
    toUserId: string;
    shouldMerge: boolean;
    countryCode: string;
  },
) {
  const fromCart = await this.orders.cart({
    countryCode,
    userId: fromUserId,
  });
  const toCart = await this.orders.cart({
    countryCode,
    userId: toUserId,
  });

  if (!fromCart) {
    return toCart;
  }

  if (toCart && shouldMerge) {
    const lock = await this.orders.acquireLock(toCart._id, 'checkout');
    try {
      const targetCart = await this.orders.findOrder({ orderId: toCart._id });
      if (targetCart && this.orders.isCart(targetCart)) {
        await this.orders.moveCartPositions({ fromOrderId: fromCart._id, toOrderId: targetCart._id });
        if (fromCart.billingAddress && !targetCart.billingAddress) {
          await this.orders.updateBillingAddress(targetCart._id, fromCart.billingAddress);
        }
        if (fromCart.contact && !targetCart.contact) {
          await this.orders.updateContact(targetCart._id, fromCart.contact);
        }
        return await updateCalculationService.bind(this)(targetCart._id);
      }
    } finally {
      await lock.release();
    }
  }

  await this.orders.setCartOwner({ orderId: fromCart._id, userId: toUserId });
  return updateCalculationService.bind(this)(fromCart._id);
}
