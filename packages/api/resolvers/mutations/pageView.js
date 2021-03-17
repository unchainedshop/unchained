import { log } from 'meteor/unchained:core-logger';
import { emit } from 'meteor/unchained:core-events';

export default (
  root,
  { path, referrer },
  { userId, localeContext, remoteAddress, version, countryContext }
) => {
  log(`mutation pageVeiw ${path} ${referrer}`, {
    localeContext,
    countryContext,
    remoteAddress,
    userId,
    version,
  });
  emit('PAGE_VIEW', {
    payload: {
      path,
      referrer,
      context: { localeContext, remoteAddress, version, countryContext },
    },
  });
  return path;
};
