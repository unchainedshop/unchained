import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { UserNotFoundError } from '../../../errors.js';

export default async function heartbeat(
  root: never,
  _: any,
  { countryCode, locale, modules, remoteAddress, remotePort, userId, getHeader }: Context,
) {
  log(`mutation heartbeat`, { userId });

  if (!userId) throw new UserNotFoundError({ userId });

  if (!(await modules.users.userExists({ userId }))) {
    throw new UserNotFoundError({ userId });
  }

  const user = await modules.users.updateHeartbeat(userId, {
    countryCode,
    locale: locale.baseName,
    remoteAddress,
    remotePort,
    userAgent: getHeader('user-agent'),
  });

  return user;
}
