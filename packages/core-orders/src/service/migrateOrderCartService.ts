import { MigrateOrderCartsService } from '@unchainedshop/types/orders.js';

export const migrateOrderCartsService: MigrateOrderCartsService = async (
  { fromUser, toUser, shouldMerge, countryContext },
  unchainedAPI,
) => {
  const fromCart = await unchainedAPI.modules.orders.cart({ countryContext }, fromUser);
  const toCart = await unchainedAPI.modules.orders.cart({ countryContext }, toUser);

  if (!fromCart) {
    // No cart, don't copy
    return toCart;
  }

  if (!toCart || !shouldMerge) {
    // No destination cart, move whole cart
    unchainedAPI.modules.orders.setCartOwner({ orderId: fromCart._id, userId: toUser._id });
    return unchainedAPI.modules.orders.updateCalculation(fromCart._id, unchainedAPI);
  }

  // Move positions
  unchainedAPI.modules.orders.moveCartPositions({ fromOrderId: fromCart._id, toOrderId: toCart._id });

  await unchainedAPI.modules.orders.updateCalculation(fromCart._id, unchainedAPI);
  return unchainedAPI.modules.orders.updateCalculation(toCart._id, unchainedAPI);
};
