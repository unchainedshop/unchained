import { updateCalculationService } from './updateCalculation.js';
import { Modules } from '../modules.js';

export async function migrateOrderCartsService(
  this: Modules,
  {
    fromUserId,
    toUserId,
    shouldMerge,
    countryContext,
  }: {
    fromUserId: string;
    toUserId: string;
    shouldMerge: boolean;
    countryContext: string;
  },
) {
  const fromCart = await this.orders.cart({
    countryCode: countryContext,
    userId: fromUserId,
  });
  const toCart = await this.orders.cart({
    countryCode: countryContext,
    userId: toUserId,
  });

  if (!fromCart) {
    // No cart, don't copy
    return toCart;
  }

  if (!toCart || !shouldMerge) {
    // No destination cart, move whole cart
    this.orders.setCartOwner({ orderId: fromCart._id, userId: toUserId });
    return updateCalculationService.bind(this)(fromCart._id);
  }

  // Move positions
  this.orders.moveCartPositions({ fromOrderId: fromCart._id, toOrderId: toCart._id });

  // Move billing address if target order has none
  if (fromCart.billingAddress && !toCart.billingAddress) {
    await this.orders.updateBillingAddress(toCart._id, fromCart.billingAddress);
  }

  // Move contact data if target order has none
  if (fromCart.contact && !toCart.contact) {
    await this.orders.updateContact(toCart._id, fromCart.contact);
  }

  return updateCalculationService.bind(this)(toCart._id);
}
