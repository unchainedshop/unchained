import { Context } from '@unchainedshop/types/api';
import { SetupWorkqueueOptions } from '@unchainedshop/types/platform';
import { EventListenerWorker, FailedRescheduler, IntervalWorker } from 'meteor/unchained:core-worker';

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
