import { Context } from '@unchainedshop/types/api';

const { UNCHAINED_DISABLE_PROVIDER_INVALIDATION, UNCHAINED_ASSIGN_CART_FOR_USERS } = process.env;

export interface SetupCartsOptions {
  invalidateProviders?: boolean;
  assignCartForUsers?: boolean;
}

export const setupCarts = async (unchainedAPI: Context, options: SetupCartsOptions = {}) => {
  if (options.invalidateProviders ?? !UNCHAINED_DISABLE_PROVIDER_INVALIDATION) {
    await unchainedAPI.modules.orders.invalidateProviders(unchainedAPI);
  }

  if (options.assignCartForUsers ?? Boolean(UNCHAINED_ASSIGN_CART_FOR_USERS)) {
    const users = await unchainedAPI.modules.users.findUsers({});

    await Promise.all(
      users.map((user) => {
        const locale = unchainedAPI.modules.users.userLocale(user);
        return unchainedAPI.modules.orders.ensureCartForUser(
          { user, countryCode: locale.country },
          unchainedAPI,
        );
      }),
    );
  }
};
