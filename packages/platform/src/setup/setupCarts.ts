import { Context } from '@unchainedshop/types/api';

const { UNCHAINED_INVALIDATE_PROVIDERS = true, UNCHAINED_ASSIGN_CART_FOR_USERS = false } = process.env;

export interface SetupCartsOptions {
  invalidateProviders?: boolean;
  assignCartForUsers?: boolean;
}

export const setupCarts = async (options: SetupCartsOptions = {}, unchainedAPI: Context) => {
  if (options.invalidateProviders ?? !!UNCHAINED_INVALIDATE_PROVIDERS) {
    await unchainedAPI.modules.orders.invalidateProviders(unchainedAPI);
  }

  if (options.assignCartForUsers ?? !!UNCHAINED_ASSIGN_CART_FOR_USERS) {
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
