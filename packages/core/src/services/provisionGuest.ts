import type { User, UserLastLogin } from '@unchainedshop/core-users';
import type { Modules } from '../modules.ts';
import { nextUserCartService } from './nextUserCart.ts';

export async function provisionGuestService(
  this: Modules,
  {
    countryCode,
    lastLogin,
    forceCartCreation,
  }: {
    countryCode: string;
    lastLogin: UserLastLogin;
    forceCartCreation?: boolean;
  },
) {
  const guestname = `guest-${crypto.randomUUID()}`;
  const guestUserId = await this.users.createUser(
    {
      email: `${guestname}@unchained.local`,
      guest: true,
      password: null,
      initialPassword: true,
    },
    { skipMessaging: true },
  );

  const user = (await this.users.updateHeartbeat(guestUserId, lastLogin)) as User;
  const cart = await nextUserCartService.bind(this)({ user, countryCode, forceCartCreation });
  return { user, cart };
}
