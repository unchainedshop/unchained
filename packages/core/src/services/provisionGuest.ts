import type { UserLastLogin } from '@unchainedshop/core-users';
import type { Modules } from '../modules.ts';
import { createServiceError } from '../errors.ts';
import { deleteUserService } from './deleteUser.ts';
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
  const userId = await this.users.createUser(
    {
      email: `${guestname}@unchained.local`,
      guest: true,
      password: null,
      initialPassword: true,
    },
    { skipMessaging: true },
  );

  try {
    const user = await this.users.updateHeartbeat(userId, lastLogin);
    if (!user) {
      throw createServiceError('GuestProvisioningError', 'Could not initialize guest user');
    }

    const cart = await nextUserCartService.bind(this)({
      user,
      countryCode,
      forceCartCreation,
    });
    return { user, cart };
  } catch (error) {
    await deleteUserService
      .bind(this)({ userId })
      .catch(() => undefined);
    throw error;
  }
}
