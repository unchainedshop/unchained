import { Context } from '@unchainedshop/types/api';
import { WorkerSchedule } from '@unchainedshop/types/worker';
import { EventListenerWorker, FailedRescheduler, IntervalWorker } from 'meteor/unchained:core-worker';

export interface SetupWorkqueueOptions {
  batchCount?: number;
  disableWorker?: boolean;
  schedule?: WorkerSchedule;
  workerId?: string;
}

export const setupWorkqueue = (
  unchainedAPI: Context,
  { workerId, batchCount, schedule }: SetupWorkqueueOptions = {},
) => {
  const handlers = [
    FailedRescheduler.actions(unchainedAPI),
    EventListenerWorker.actions({ workerId }, unchainedAPI),
    IntervalWorker.actions({ workerId, batchCount, schedule }, unchainedAPI),
  ];

  handlers.forEach((handler) => handler.start());
  return handlers;
};
