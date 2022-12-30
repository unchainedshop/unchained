import { SetupWorkqueueOptions } from '@unchainedshop/types/platform.js';
import { EventListenerWorker, FailedRescheduler, IntervalWorker } from '@unchainedshop/core-worker';
import { UnchainedCore } from '@unchainedshop/types/core.js';

export const setupWorkqueue = (
  unchainedAPI: UnchainedCore,
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
