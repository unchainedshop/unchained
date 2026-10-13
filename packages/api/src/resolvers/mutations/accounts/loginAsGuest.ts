import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import type { User } from '@unchainedshop/core-users';

export default async function loginAsGuest(root: never, _: any, context: Context) {
  log('mutation loginAsGuest');

  const guestname = `guest-${crypto.randomUUID()}`;
  const guestUserId = await context.modules.users.createUser(
    {
      email: `${guestname}@unchained.local`,
      guest: true,
      password: null,
      initialPassword: true,
    },
    { skipMessaging: true },
  );

  const user = (await context.modules.users.updateHeartbeat(guestUserId, {
    remoteAddress: context.remoteAddress,
    remotePort: context.remotePort,
    userAgent: context.getHeader('user-agent'),
    locale: context.locale?.baseName,
    countryCode: context.countryCode,
  })) as User;

  await context.services.orders.nextUserCart({ user, countryCode: context.countryCode });

  return context.login(user);
}
