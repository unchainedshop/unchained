import { userSettings } from '@unchainedshop/core-users';
import { migrateBookmarksService } from './migrateBookmarks.js';
import { migrateOrderCartsService } from './migrateOrderCart.js';

export async function migrateUserDataService(userIdBeforeLogin: string, userId: string) {
  const user = await this.users.findUserById(userId);
  const userBeforeLogin = await this.users.findUserById(userIdBeforeLogin);

  await migrateOrderCartsService.bind(this)({
    fromUserId: userIdBeforeLogin,
    toUserId: userId,
    shouldMerge: userSettings.mergeUserCartsOnLogin,
    countryCode: userBeforeLogin?.lastLogin?.countryCode || user?.lastLogin?.countryCode,
  });

  await migrateBookmarksService.bind(this)({
    fromUserId: userIdBeforeLogin,
    toUserId: userId,
    shouldMerge: userSettings.mergeUserCartsOnLogin,
    countryCode: userBeforeLogin?.lastLogin?.countryCode || user?.lastLogin?.countryCode,
  });
}
