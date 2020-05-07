import { WorkerDirector } from 'meteor/unchained:core-worker';
import GenerateSubscriptionOrders from './worker/generate-orders';

import './db/subscriptions/helpers';
import './db/subscriptions/factories';
import './db/subscriptions/schema';

export * from './director';
export * from './db/subscriptions/collections';
export * from './db/subscriptions/schema';

export default () => {
  // configure
  WorkerDirector.configureAutoscheduling(GenerateSubscriptionOrders, {
    cronText: 'every 59 minutes',
    input: () => {
      return {};
    },
  });
};
