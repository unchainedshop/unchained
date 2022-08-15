import { UnchainedCore } from '@unchainedshop/types/core';
import { SetupCartsOptions } from '@unchainedshop/types/platform';

const { UNCHAINED_DISABLE_PROVIDER_INVALIDATION, UNCHAINED_ASSIGN_CART_FOR_USERS } = process.env;

export const setupCarts = async (unchainedAPI: UnchainedCore, options: SetupCartsOptions = {}) => {
  if (options.invalidateProviders ?? !UNCHAINED_DISABLE_PROVIDER_INVALIDATION) {
    await unchainedAPI.modules.orders.invalidateProviders(
      unchainedAPI,
      options.providerInvalidationMaxAgeDays,
    );
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
