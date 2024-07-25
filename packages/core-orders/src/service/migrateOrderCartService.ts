import { MigrateOrderCartsService } from '@unchainedshop/types/orders.js';

export const migrateOrderCartsService: MigrateOrderCartsService = async (
  { fromUserId, toUserId, shouldMerge, countryContext },
  unchainedAPI,
) => {
  const fromCart = await unchainedAPI.modules.orders.cart({
    countryContext,
    userId: fromUserId,
  });
  const toCart = await unchainedAPI.modules.orders.cart({
    countryContext,
    userId: toUserId,
  });

  if (!fromCart) {
    // No cart, don't copy
    return toCart;
  }

  if (!toCart || !shouldMerge) {
    // No destination cart, move whole cart
    unchainedAPI.modules.orders.setCartOwner({ orderId: fromCart._id, userId: toUserId });
    return unchainedAPI.modules.orders.updateCalculation(fromCart._id, unchainedAPI);
  }

  // Move positions
  unchainedAPI.modules.orders.moveCartPositions({ fromOrderId: fromCart._id, toOrderId: toCart._id });

  // Move billing address if target order has none
  if (fromCart.billingAddress && !toCart.billingAddress) {
    await unchainedAPI.modules.orders.updateBillingAddress(toCart._id, fromCart.billingAddress);
  }

  // Move contact data if target order has none
  if (fromCart.contact && !toCart.contact) {
    await unchainedAPI.modules.orders.updateContact(toCart._id, fromCart.contact);
  }

  await unchainedAPI.modules.orders.updateCalculation(fromCart._id, unchainedAPI);
  return unchainedAPI.modules.orders.updateCalculation(toCart._id, unchainedAPI);
};
