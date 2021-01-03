import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default function heartbeat(
  root,
  params,
  { userId, remoteAddress, localeContext, countryContext }
) {
  log(`mutation updateHeartbeat ${remoteAddress}`, { userId });
  if (!Users.userExists({ userId })) throw new UserNotFoundError({ userId });
  Users.updateHeartbeat({
    userId,
    remoteAddress,
    locale: localeContext.normalized,
    countryContext,
  });
  return Users.findUser({ userId });
}
