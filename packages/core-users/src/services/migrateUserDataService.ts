import { UnchainedCore } from '@unchainedshop/core';
import { userSettings } from '../users-settings.js';

export type MigrateUserDataService = (
  userIdBeforeLogin,
  userId,
  unchainedAPI: UnchainedCore,
) => Promise<void>;

export const migrateUserDataService: MigrateUserDataService = async (
  userIdBeforeLogin,
  userId,
  unchainedAPI,
) => {
  const user = await unchainedAPI.modules.users.findUserById(userId);
  const userBeforeLogin = await unchainedAPI.modules.users.findUserById(userIdBeforeLogin);

  await unchainedAPI.services.orders.migrateOrderCarts(
    {
      fromUserId: userIdBeforeLogin,
      toUserId: userId,
      shouldMerge: userSettings.mergeUserCartsOnLogin,
      countryContext: userBeforeLogin.lastLogin?.countryCode || user.lastLogin?.countryCode,
    },
    unchainedAPI,
  );

  await unchainedAPI.services.bookmarks.migrateBookmarks(
    {
      fromUserId: userIdBeforeLogin,
      toUserId: userId,
      shouldMerge: userSettings.mergeUserCartsOnLogin,
      countryContext: userBeforeLogin.lastLogin?.countryCode || user.lastLogin?.countryCode,
    },
    unchainedAPI,
  );
};
