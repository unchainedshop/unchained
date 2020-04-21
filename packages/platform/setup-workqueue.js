import { WorkerDirector } from 'meteor/unchained:core-worker';
import EventListenerWorker from 'meteor/unchained:core-worker/workers/eventListener';
import CronWorker from 'meteor/unchained:core-worker/workers/cron';
import FailedRescheduler from 'meteor/unchained:core-worker/schedulers/failedRescheduler';

export const workerTypeDefs = () => [
  /* GraphQL */ `
    extend enum WorkType {
      ${WorkerDirector.getActivePluginTypes().join(',')}
    }
  `,
];

export default ({ cronText }) => {
  new FailedRescheduler({ WorkerDirector }).start();
  new EventListenerWorker({
    WorkerDirector,
    workerId: 'EventWorker',
  }).start();
  if (cronText) {
    new CronWorker({
      WorkerDirector,
      workerId: 'CronWorker',
      cronText,
    }).start();
  }
};
