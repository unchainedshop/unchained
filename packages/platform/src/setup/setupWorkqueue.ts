import { UnchainedCore } from '@unchainedshop/core';
import { EventListenerWorker } from '@unchainedshop/plugins/worker/EventListenerWorker.js';
import { IntervalWorker, IntervalWorkerParams } from '@unchainedshop/plugins/worker/IntervalWorker.js';
import { FailedRescheduler, IScheduler } from '@unchainedshop/plugins/worker/FailedRescheduler.js';
import { IWorker } from '@unchainedshop/plugins/worker/BaseWorker.js';
import { runMigrations } from '../migrations/runMigrations.js';
import { MigrationRepository } from '@unchainedshop/mongodb';
import { WorkData } from '@unchainedshop/core-worker';

export type WorkQueueQueueManager = IWorker<any> | IScheduler<any>;
export interface SetupWorkqueueOptions {
  enabledQueueManagers?: Array<WorkQueueQueueManager>;
  invalidateProviders?: boolean;
  providerInvalidationMaxAgeDays?: number;
  assignCartForUsers?: boolean;
  disableWorker?: boolean;
  batchCount?: number;
  schedule?: IntervalWorkerParams['schedule'];
  workerId?: string;
  skipInvalidationOnStartup?: boolean;
  transformRetry?: (workData: WorkData) => Promise<WorkData | null>;
}

const {
  UNCHAINED_DISABLE_PROVIDER_INVALIDATION,
  UNCHAINED_DISABLE_WORKER,
  UNCHAINED_ASSIGN_CART_FOR_USERS,
} = process.env;

export const defaultQueueManagers: Array<WorkQueueQueueManager> = [
  FailedRescheduler,
  EventListenerWorker,
  IntervalWorker,
];

export const queueWorkers: Array<any> = [];

export const setupWorkqueue = async ({
  unchainedAPI,
  migrationRepository,
  ...workQueueOptions
}: {
  unchainedAPI: UnchainedCore;
  migrationRepository: MigrationRepository<UnchainedCore>;
} & SetupWorkqueueOptions) => {
  if (workQueueOptions.disableWorker || UNCHAINED_DISABLE_WORKER) return;

  // Run migrations
  await runMigrations({ migrationRepository, unchainedAPI });

  // Start queue managers
  (workQueueOptions?.enabledQueueManagers || defaultQueueManagers).forEach((f) => {
    const handler = f.actions(workQueueOptions, unchainedAPI);
    queueWorkers.push(handler);
    handler.start();
  });

  // Invalidate providers on carts
  if (workQueueOptions.invalidateProviders ?? !UNCHAINED_DISABLE_PROVIDER_INVALIDATION) {
    const orders = await unchainedAPI.modules.orders.findCartsToInvalidate(
      workQueueOptions.providerInvalidationMaxAgeDays,
    );
    await Promise.allSettled(
      orders.map(async (order) => {
        await unchainedAPI.services.orders.updateCalculation(order._id);
      }),
    );
  }

  // Ensure users have carts
  if (workQueueOptions.assignCartForUsers ?? Boolean(UNCHAINED_ASSIGN_CART_FOR_USERS)) {
    const users = await unchainedAPI.modules.users.findUsers({});

    await Promise.all(
      users.map((user) => {
        const locale = unchainedAPI.modules.users.userLocale(user);
        return unchainedAPI.services.orders.nextUserCart({
          user,
          countryCode: locale.region,
        });
      }),
    );
  }

  // Setup filter cache
  if (!workQueueOptions?.skipInvalidationOnStartup) {
    setImmediate(() => unchainedAPI.services.filters.invalidateFilterCache());
  }
};
