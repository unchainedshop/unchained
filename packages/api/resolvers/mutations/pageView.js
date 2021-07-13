import { log } from 'meteor/unchained:core-logger';
import { emit } from 'meteor/unchained:core-events';

export default (root, { path, referrer }, context) => {
  log(`mutation pageView ${path} ${referrer}`, {
    userId: context.userId,
  });
  emit('PAGE_VIEW', {
    path,
    referrer,
  });
  return path;
};
