import { WorkerDirector } from 'meteor/unchained:core-worker';
import { registerEvents } from 'meteor/unchained:director-events';
import GenerateEnrollmentOrders from './worker/generate-orders';
import settings from './settings';

import './db/enrollments/helpers';
import createIndexes from './db/enrollments/schema';

export * from './director';
export * from './db/enrollments/collections';
export * from './db/enrollments/schema';

export default (options) => {
  // configure
  settings.load(options);
  if (settings.autoSchedulingSchedule) {
    WorkerDirector.configureAutoscheduling(GenerateEnrollmentOrders, {
      schedule: settings.autoSchedulingSchedule,
      input: settings.autoSchedulingInput,
    });
  }
  createIndexes();
  registerEvents(['ENROLLMENT_CREATE']);
};
