import { log } from 'meteor/unchained:core-logger';
import { emit } from 'meteor/unchained:core-events';

export default (
  root,
  { path },
  { localeContext, remoteAddress, version, countryContext, req }
) => {
  log(`mutation pageVeiw ${path}`, {
    localeContext,
    countryContext,
    remoteAddress,
    version,
  });
  emit('PAGE_VIEW', {
    payload: {
      path,
      context: { localeContext, remoteAddress, version, countryContext, req },
    },
  });
  return path;
};
