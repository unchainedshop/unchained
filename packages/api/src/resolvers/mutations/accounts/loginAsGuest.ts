import { log } from '@unchainedshop/logger';
import moniker from 'moniker';
import { Context } from '../../../context.js';
import { generateDbObjectId } from '@unchainedshop/mongodb';

export default async function loginAsGuest(root: never, _: any, context: Context) {
  log('mutation loginAsGuest');

  const guestname = `${moniker.choose()}-${generateDbObjectId(5)}`;
  const guestUserId = await context.modules.users.createUser(
    {
      email: `${guestname}@unchained.local`,
      guest: true,
      password: null,
      initialPassword: true,
    },
    { skipMessaging: true },
  );

  let user = await context.modules.users.findUserById(guestUserId);

  user = await context.modules.users.updateHeartbeat(user._id, {
    remoteAddress: context.remoteAddress,
    remotePort: context.remotePort,
    userAgent: context.userAgent,
    locale: context.localeContext.baseName,
    countryCode: context.countryContext,
  });

  return context.login(user);
}
