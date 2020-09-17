import { WorkerDirector } from 'meteor/unchained:core-worker';
import GenerateSubscriptionOrders from './worker/generate-orders';
import settings from './settings';

import './db/subscriptions/helpers';
import './db/subscriptions/factories';
import runMigrations from './db/subscriptions/schema';

export * from './director';
export * from './db/subscriptions/collections';
export * from './db/subscriptions/schema';

export default (options) => {
  // configure
  settings.load(options);
  if (settings.autoSchedulingCronText) {
    WorkerDirector.configureAutoscheduling(GenerateSubscriptionOrders, {
      cronText: settings.autoSchedulingCronText,
      input: settings.autoSchedulingInput,
    });
  }
  runMigrations();
};
