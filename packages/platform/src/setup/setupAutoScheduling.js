import { configureGenerateOrderAutoscheduling } from 'meteor/unchained:core-enrollments/workers/GenerateOrderWorker';

export const setupAutoScheduling = () => {
  configureGenerateOrderAutoscheduling();
};
