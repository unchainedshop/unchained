import { type User, type UserLastLogin, userSettings } from '@unchainedshop/core-users';
import type { Modules } from '../modules.ts';
import { migrateUserDataService } from './migrateUserData.ts';
import { nextUserCartService } from './nextUserCart.ts';

export async function loginWithLoginCodeService(
  this: Modules,
  credentials: { email?: string; code?: string; token?: string },
  {
    userIdBeforeLogin,
    countryCode,
    lastLogin,
  }: { userIdBeforeLogin?: string; countryCode: string; lastLogin: UserLastLogin },
): Promise<User | null> {
  if (!userSettings.loginCode.enabled) return null;

  const challenge = await this.users.loginCode.consumeChallenge(credentials);
  const challengeUser = challenge && (await this.users.findUserById(challenge.userId));
  if (!challengeUser || challengeUser.deleted) return null;

  await this.users.verifyEmail(challengeUser._id, challenge.email);
  if (challengeUser.guest) await this.users.updateGuest(challengeUser, false);
  const user = (await this.users.updateHeartbeat(challengeUser._id, lastLogin)) as User;

  if (userIdBeforeLogin) await migrateUserDataService.call(this, userIdBeforeLogin, user._id);
  await nextUserCartService.call(this, { user, countryCode });
  return user;
}
