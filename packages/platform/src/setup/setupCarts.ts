import { Context } from '@unchainedshop/types/api';

const {
  UNCHAINED_INVALIDATE_PROVIDERS = true,
  UNCHAINED_ASSIGN_CART_FOR_USERS = false,
} = process.env;

export const setupCarts = async (
  options: {
    invalidateProviders?: boolean;
    assignCartForUsers?: boolean;
  } = {},
  unchainedAPI: Context
) => {
  if (options.invalidateProviders ?? !!UNCHAINED_INVALIDATE_PROVIDERS) {
    await unchainedAPI.modules.orders.invalidateProviders(unchainedAPI);
  }

  if (options.assignCartForUsers ?? !!UNCHAINED_ASSIGN_CART_FOR_USERS) {
    const users = await unchainedAPI.modules.users.findUsers({});

    await Promise.all(
      users.map(
        async (user) =>
          await unchainedAPI.modules.orders.ensureCartForUser(
            { user },
            unchainedAPI
          )
      )
    );
  }
};
