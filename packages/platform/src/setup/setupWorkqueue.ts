import { FailedRescheduler, IntervalWorker } from '@unchainedshop/core-worker';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { WorkData, WorkerSchedule } from '@unchainedshop/types/worker.js';

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
  { workerId, batchCount, schedule, retryInput }: SetupWorkqueueOptions = {},
) => {
  const handlers = [
    FailedRescheduler.actions({ retryInput }, unchainedAPI),
    IntervalWorker.actions({ workerId, batchCount, schedule }, unchainedAPI),
  ];

  handlers.forEach((handler) => handler.start());
  return handlers;
};
