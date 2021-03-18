import { log } from 'meteor/unchained:core-logger';
import { emit, subscribe } from 'meteor/unchained:core-events';

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
  subscribe('PAGE_VIEW', (e) => console.log(e, 'hellop'));
  emit('PAGE_VIEW', {
    payload: {
      path,
      referrer,
      context: { localeContext, remoteAddress, version, countryContext },
    },
  });
  return path;
};
