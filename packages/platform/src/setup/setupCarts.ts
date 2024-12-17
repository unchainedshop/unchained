import { UnchainedCore } from '@unchainedshop/core';

export interface SetupCartsOptions {
  invalidateProviders?: boolean;
  providerInvalidationMaxAgeDays?: number;
  assignCartForUsers?: boolean;
}
const { UNCHAINED_DISABLE_PROVIDER_INVALIDATION, UNCHAINED_ASSIGN_CART_FOR_USERS } = process.env;

export const setupCarts = async (unchainedAPI: UnchainedCore, options: SetupCartsOptions = {}) => {
  if (options.invalidateProviders ?? !UNCHAINED_DISABLE_PROVIDER_INVALIDATION) {
    const orders = await unchainedAPI.modules.orders.findCartsToInvalidate(
      options.providerInvalidationMaxAgeDays,
    );
    await Promise.allSettled(
      orders.map(async (order) => {
        await unchainedAPI.services.orders.updateCalculation(order._id);
      }),
    );
  }

  if (options.assignCartForUsers ?? Boolean(UNCHAINED_ASSIGN_CART_FOR_USERS)) {
    const users = await unchainedAPI.modules.users.findUsers({});

    await Promise.all(
      users.map((user) => {
        const locale = unchainedAPI.modules.users.userLocale(user);
        return unchainedAPI.services.orders.nextUserCart({
          user,
          countryCode: locale.region,
        });
      }),
    );
  }
};
