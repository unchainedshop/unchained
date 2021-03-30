import { WorkerDirector } from 'meteor/unchained:core-worker';
import EventListenerWorker from 'meteor/unchained:core-worker/workers/eventListener';
import IntervalWorker from 'meteor/unchained:core-worker/workers/interval';
import FailedRescheduler from 'meteor/unchained:core-worker/schedulers/failedRescheduler';

export const workerTypeDefs = () => [
  /* GraphQL */ `
    extend enum WorkType {
      ${WorkerDirector.getActivePluginTypes().join(',')}
    }
  `,
];

export default (options) => {
  const handlers = [
    new FailedRescheduler({ WorkerDirector, ...options }),
    new EventListenerWorker({
      WorkerDirector,
      ...options,
    }),
    new IntervalWorker({
      WorkerDirector,
      ...options,
    }),
  ];

  handlers.forEach((handler) => handler.start());
  return handlers;
};
