import {
  EventListenerWorker,
  FailedRescheduler,
  IntervalWorker,
  WorkerSchedule,
  WorkData,
} from '@unchainedshop/core-worker';
import { UnchainedCore } from '@unchainedshop/types/core.js';

export interface SetupWorkqueueOptions {
  batchCount?: number;
  disableWorker?: boolean;
  schedule?: WorkerSchedule;
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
