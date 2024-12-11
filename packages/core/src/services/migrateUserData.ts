import { userSettings } from '@unchainedshop/core-users';
import { migrateBookmarksService } from './migrateBookmarks.js';
import { migrateOrderCartsService } from './migrateOrderCart.js';
import { Modules } from '../modules.js';

export type MigrateUserDataService = (
  userIdBeforeLogin,
  userId,
  unchainedAPI: { modules: Modules },
) => Promise<void>;

export const migrateUserDataService: MigrateUserDataService = async (
  userIdBeforeLogin,
  userId,
  unchainedAPI,
) => {
  const user = await unchainedAPI.modules.users.findUserById(userId);
  const userBeforeLogin = await unchainedAPI.modules.users.findUserById(userIdBeforeLogin);

  await migrateOrderCartsService(
    {
      fromUserId: userIdBeforeLogin,
      toUserId: userId,
      shouldMerge: userSettings.mergeUserCartsOnLogin,
      countryContext: userBeforeLogin.lastLogin?.countryCode || user.lastLogin?.countryCode,
    },
    unchainedAPI,
  );

  await migrateBookmarksService(
    {
      fromUserId: userIdBeforeLogin,
      toUserId: userId,
      shouldMerge: userSettings.mergeUserCartsOnLogin,
      countryContext: userBeforeLogin.lastLogin?.countryCode || user.lastLogin?.countryCode,
    },
    unchainedAPI,
  );
};
