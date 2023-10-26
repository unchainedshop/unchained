import { MigrateUserDataService } from '@unchainedshop/types/user.js';
import { userSettings } from '../users-settings.js';

export const migrateUserDataService: MigrateUserDataService = async (
  userIdBeforeLogin,
  userId,
  unchainedAPI,
) => {
  const user = await unchainedAPI.modules.users.findUserById(userId);
  const userBeforeLogin = await unchainedAPI.modules.users.findUserById(userIdBeforeLogin);

  await unchainedAPI.services.orders.migrateOrderCarts(
    {
      fromUser: userBeforeLogin,
      toUser: user,
      shouldMerge: userSettings.mergeUserCartsOnLogin,
      countryContext: user.lastLogin.countryCode,
    },
    unchainedAPI,
  );

  await unchainedAPI.services.bookmarks.migrateBookmarks(
    {
      fromUser: userBeforeLogin,
      toUser: user,
      shouldMerge: userSettings.mergeUserCartsOnLogin,
      countryContext: user.lastLogin.countryCode,
    },
    unchainedAPI,
  );
};
