import {
  EventListenerWorker,
  FailedRescheduler,
  type FailedReschedulerParams,
  IntervalWorker,
  type IntervalWorkerParams,
  type IScheduler,
  type IWorker,
  type UnchainedCore,
} from '@unchainedshop/core';
import { runMigrations } from '../migrations/runMigrations.ts';
import type { MigrationRepository } from '@unchainedshop/mongodb';
import { createLogger } from '@unchainedshop/logger';
const logger = createLogger('unchained:worker');

export type WorkQueueQueueManager = IWorker<any> | IScheduler<any>;
export interface SetupWorkqueueOptions extends IntervalWorkerParams, FailedReschedulerParams {
  enabledQueueManagers?: WorkQueueQueueManager[];
  invalidateProviders?: boolean;
  providerInvalidationMaxAgeDays?: number;
  assignCartForUsers?: boolean;
  disableWorker?: boolean;
  skipInvalidationOnStartup?: boolean;
}

const {
  UNCHAINED_DISABLE_PROVIDER_INVALIDATION,
  UNCHAINED_DISABLE_WORKER,
  UNCHAINED_ASSIGN_CART_FOR_USERS,
} = process.env;

export const defaultQueueManagers: WorkQueueQueueManager[] = [
  FailedRescheduler,
  EventListenerWorker,
  IntervalWorker,
];

export const queueWorkers: any[] = [];

export async function setupWorkqueue({
  unchainedAPI,
  migrationRepository,
  ...workQueueOptions
}: {
  unchainedAPI: UnchainedCore;
  migrationRepository: MigrationRepository<UnchainedCore>;
} & SetupWorkqueueOptions) {
  if (workQueueOptions.disableWorker || UNCHAINED_DISABLE_WORKER) return;

  // Run migrations
  await runMigrations({ migrationRepository, unchainedAPI });

  // Start queue managers
  (workQueueOptions?.enabledQueueManagers || defaultQueueManagers).forEach((f) => {
    const handler = f.actions(workQueueOptions, unchainedAPI);
    queueWorkers.push(handler);
    handler.start();
  });

  // Cart recalculation runs through the INVALIDATE_CARTS worker (also autoscheduled
  // monthly on the 1st at 00:00) instead of blocking boot. In the cases that used to
  // recalculate inline on startup, enqueue an immediate, non-blocking work item so the
  // queue drains it one cart at a time rather than spiking Mongo on a cold pool.
  if (workQueueOptions.invalidateProviders ?? !UNCHAINED_DISABLE_PROVIDER_INVALIDATION) {
    await unchainedAPI.modules.worker.addWorkIfNotExists(
      {
        type: 'INVALIDATE_CARTS',
        input:
          workQueueOptions.providerInvalidationMaxAgeDays !== undefined
            ? { maxAgeDays: workQueueOptions.providerInvalidationMaxAgeDays }
            : {},
        // Eventual recalculation: don't retry, the monthly schedule picks up any misses.
        retries: 0,
      },
      // Only dedup against a previously-enqueued *immediate* sweep. The autoscheduler
      // keeps a NEW, autoscheduled item permanently parked for the next monthly run, so a
      // `() => true` predicate would always match it and suppress the boot sweep entirely.
      (work) => !work.autoscheduled,
    );
  }

  // Ensure users have carts
  if (workQueueOptions.assignCartForUsers ?? Boolean(UNCHAINED_ASSIGN_CART_FOR_USERS)) {
    const users = await unchainedAPI.modules.users.findUsers({});

    await Promise.all(
      users.map((user) => {
        const locale = unchainedAPI.modules.users.userLocale(user);
        if (!locale.region) return null;
        return unchainedAPI.services.orders.nextUserCart({
          user,
          countryCode: locale.region,
        });
      }),
    );
  }

  // Setup filter cache
  if (!workQueueOptions?.skipInvalidationOnStartup) {
    unchainedAPI.services.filters
      .invalidateFilterCache()
      .then(() => {
        logger.info('Filter cache rebuilt');
      })
      .catch(logger.warn);
  }
}

export function stopWorkqueue() {
  queueWorkers.forEach((worker) => {
    worker?.stop();
  });
  queueWorkers.length = 0;
}
