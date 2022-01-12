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

export const setupWorkqueue = (modules, { workerId, batchCount, schedule }) => {
  const handlers = [
    new FailedRescheduler({ modules, workerId }),
    new EventListenerWorker({
      modules,
      workerId,
    }),
    new IntervalWorker({
      modules,
      workerId,
      batchCount,
      schedule,
    }),
  ];

  handlers.forEach((handler) => handler.start());
  return handlers;
};
