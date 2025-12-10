import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { UserNotFoundError } from '../../../errors.ts';

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
