import { log } from 'meteor/unchained:logger';
import { emit } from 'meteor/unchained:events';

export default (root: Root, { path, referrer }, context) => {
  log(`mutation pageView ${path} ${referrer}`, {
    userId: context.userId,
  });
  emit('PAGE_VIEW', {
    path,
    referrer,
  });
  return path;
};
