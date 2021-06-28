import { log } from 'meteor/unchained:core-logger';
import { emit } from 'meteor/unchained:core-events';

export default (
  root,
  { path, referrer },
  { userId, localeContext, remoteAddress, version, countryContext, req }
) => {
  log(`mutation pageVeiw ${path} ${referrer}`, {
    localeContext,
    countryContext,
    remoteAddress,
    userId,
    version,
  });
  emit('PAGE_VIEW', {
    path,
    referrer,
    context: {
      localeContext,
      userId,
      remoteAddress,
      version,
      countryContext,
      headers: req.headers,
    },
  });
  return path;
};
