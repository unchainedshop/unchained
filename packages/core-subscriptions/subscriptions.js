import { WorkerDirector } from 'meteor/unchained:core-worker';
import { registerEvents } from 'meteor/unchained:core-events';
import GenerateSubscriptionOrders from './worker/generate-orders';
import settings from './settings';

import './db/subscriptions/helpers';
import runMigrations from './db/subscriptions/schema';

export * from './director';
export * from './db/subscriptions/collections';
export * from './db/subscriptions/schema';

export default (options) => {
  // configure
  settings.load(options);
  if (settings.autoSchedulingSchedule) {
    WorkerDirector.configureAutoscheduling(GenerateSubscriptionOrders, {
      schedule: settings.autoSchedulingSchedule,
      input: settings.autoSchedulingInput,
    });
  }
  runMigrations();
  registerEvents(['SUBSCRIPTION_CREATE']);
};
