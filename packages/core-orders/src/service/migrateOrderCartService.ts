import { MigrateOrderCartsService } from '@unchainedshop/types/orders';

export const migrateOrderCartsService: MigrateOrderCartsService = async (
  { fromUserId, toUser, countryContext, shouldMergeCarts },
  requestContext
) => {
  const cartContext = { countryContext };
  const fromUser = await requestContext.modules.users.findUser({
    userId: fromUserId,
  });
  const fromCart = await requestContext.modules.orders.cart(
    cartContext,
    fromUser
  );
  const toCart = await requestContext.modules.orders.cart(cartContext, toUser);

  if (!fromCart) {
    // No cart, don't copy
    return toCart;
  }

  return requestContext.modules.orders.migrateCart(
    { fromCart, shouldMergeCarts, toCart },
    requestContext
  );
};
