import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { UserNotFoundError } from '../../../errors.js';

export default async function heartbeat(
  root: Root,
  _: any,
  { countryContext, localeContext, modules, remoteAddress, remotePort, userAgent, userId }: Context,
) {
  log(`mutation heartbeat ${remoteAddress}`, { userId });

  if (!userId) throw new UserNotFoundError({ userId });

  if (!(await modules.users.userExists({ userId }))) {
    throw new UserNotFoundError({ userId });
  }

  const user = await modules.users.updateHeartbeat(userId, {
    countryCode: countryContext,
    locale: localeContext.normalized,
    remoteAddress,
    remotePort,
    userAgent,
  });

  return user;
}
