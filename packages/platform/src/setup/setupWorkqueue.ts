import { UnchainedCore } from '@unchainedshop/core';
import {
  EventListenerWorker,
  FailedRescheduler,
  IntervalWorker,
  IntervalWorkerParams,
  WorkData,
} from '@unchainedshop/core-worker';

export interface SetupWorkqueueOptions {
  batchCount?: number;
  disableWorker?: boolean;
  schedule?: IntervalWorkerParams['schedule'];
  workerId?: string;
  retryInput?: (
    workData: WorkData,
    priorInput: Record<string, any>,
  ) => Promise<Record<string, any> | null>;
}

export const setupWorkqueue = (
  unchainedAPI: UnchainedCore,
  workQueueOptions: SetupWorkqueueOptions = {},
) => {
  const handlers = [
    FailedRescheduler.actions(workQueueOptions, unchainedAPI),
    EventListenerWorker.actions(workQueueOptions, unchainedAPI),
    IntervalWorker.actions(workQueueOptions, unchainedAPI),
  ];

  handlers.forEach((handler) => handler.start());
  return handlers;
};
