import { WorkerDirector } from 'meteor/unchained:core-worker';
import RemoveStaleGuests from './worker/remove-stale-guests';
import settings from './settings';

import runMigrations from './db/schema';
import './db/helpers';

export * from './db/schema';
export * from './db/collections';

export default (options) => {
  // configure
  settings.load(options);
  if (settings.autoSchedulingCronText) {
    WorkerDirector.configureAutoscheduling(RemoveStaleGuests, {
      cronText: settings.autoSchedulingCronText,
      input: settings.autoSchedulingInput,
    });
  }
  runMigrations();
};
