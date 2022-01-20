import { Context } from '@unchainedshop/types/api';
import { WorkerSchedule } from '@unchainedshop/types/worker';
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

export interface SetupWorkqueueOptions {
  batchCount?: number;
  disableWorker?: boolean;
  schedule?: WorkerSchedule;
  workerId?: string;
}

export const setupWorkqueue = (
  { workerId, batchCount, schedule }: SetupWorkqueueOptions = {},
  unchainedAPI: Context
) => {
  const handlers = [
    FailedRescheduler.actions(unchainedAPI),
    EventListenerWorker.actions({ workerId }, unchainedAPI),
    IntervalWorker.actions({ workerId, batchCount, schedule }, unchainedAPI),
  ];

  handlers.forEach((handler) => handler.start());
  return handlers;
};
