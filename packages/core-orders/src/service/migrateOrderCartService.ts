import { MigrateOrderCartsService } from '@unchainedshop/types/orders';

export const migrateOrderCartsService: MigrateOrderCartsService = async (
  { fromUser, toUser, shouldMergeCarts },
  requestContext,
) => {
  const fromCart = await requestContext.modules.orders.cart(
    { countryContext: requestContext.countryContext },
    fromUser,
  );
  const toCart = await requestContext.modules.orders.cart(
    { countryContext: requestContext.countryContext },
    toUser,
  );

  if (!fromCart) {
    // No cart, don't copy
    return toCart;
  }

  return requestContext.modules.orders.migrateCart(
    { fromCart, shouldMergeCarts, toCart },
    requestContext,
  );
};
