import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default function heartbeat(
  root,
  params,
  { userId, remoteAddress, localeContext, countryContext },
) {
  log(`mutation updateHeartbeat ${remoteAddress}`, { userId });
  Users.updateHeartbeat({
    _id: userId,
    remoteAddress,
    locale: localeContext.normalized,
    country: countryContext,
  });
  return Users.findOne({ _id: userId });
}
