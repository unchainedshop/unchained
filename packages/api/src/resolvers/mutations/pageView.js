import { log } from '@unchainedshop/logger';
import { emit } from '@unchainedshop/events';

export default (root, { path, referrer }, { userId }) => {
  log(`mutation pageView ${path} ${referrer}`, { userId });

  emit('PAGE_VIEW', {
    path,
    referrer,
  });

  return path;
};
