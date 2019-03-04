import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default function(
  root,
  params,
  { userId, remoteAddress, localeContext, countryContext }
) {
  log(`query me ${remoteAddress}`, { userId });
  return Users.findOneWithHeartbeat({
    userId,
    remoteAddress,
    locale: localeContext.normalized,
    country: countryContext
  });
}
