import { log } from '@unchainedshop/logger';
import { emit } from '@unchainedshop/events';

export default async (root, { path, referrer }, { userId }) => {
  log(`mutation pageView ${path} ${referrer}`, { userId });

  await emit('PAGE_VIEW', {
    path,
    referrer,
  });

  return path;
};
