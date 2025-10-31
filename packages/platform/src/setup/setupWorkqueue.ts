import {
  EventListenerWorker,
  FailedRescheduler,
  FailedReschedulerParams,
  IntervalWorker,
  IntervalWorkerParams,
  IScheduler,
  IWorker,
  UnchainedCore,
} from '@unchainedshop/core';
import { runMigrations } from '../migrations/runMigrations.js';
import { MigrationRepository } from '@unchainedshop/mongodb';
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
    await unchainedAPI.services.filters.invalidateFilterCache().catch(logger.warn);
  }
}

export function stopWorkqueue() {
  queueWorkers.forEach((worker) => {
    worker?.stop();
  });
  queueWorkers.length = 0;
}
