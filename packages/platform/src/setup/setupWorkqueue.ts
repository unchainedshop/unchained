import { Context } from '@unchainedshop/types/api';
import {
  WorkerDirector,
  EventListenerWorker,
  IntervalWorker,
  FailedRescheduler,
} from 'meteor/unchained:core-worker';

export const workerTypeDefs = () => [
  /* GraphQL */ `
    extend enum WorkType {
      ${WorkerDirector.getActivePluginTypes().join(',')}
    }
  `,
];

export const setupWorkqueue = (
  { workerId, batchCount, schedule },
  unchainedAPI: Context
) => {
  const handlers = [
    new FailedRescheduler({ workerId }, unchainedAPI),
    new EventListenerWorker(
      {
        workerId,
      },
      unchainedAPI
    ),
    new IntervalWorker(
      {
        workerId,
        batchCount,
        schedule,
      },
      unchainedAPI
    ),
  ];

  handlers.forEach((handler) => handler.start());
  return handlers;
};
