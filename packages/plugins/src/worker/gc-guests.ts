import { type IWorkerAdapter, WorkerAdapter, WorkerDirector, schedule } from '@unchainedshop/core';
import { userSettings } from '@unchainedshop/core-users';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:worker:gc-guests');

const ONE_DAY_IN_MILLISECONDS = 86400000;

// Daily, off-peak.
const everyDayAtHalfPastTwo = schedule.parse.cron('30 2 * * *');

export const GCGuestsWorker: IWorkerAdapter<
  { guestUserMaxAgeInDays?: number },
  { scannedGuestCount: number; deletedGuestCount: number }
> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.gc-guests',
  label: 'Garbage Collect Guests',
  version: '1.0.0',
  type: 'GC_GUESTS',

  doWork: async ({ guestUserMaxAgeInDays } = {}, unchainedAPI) => {
    const { modules, services } = unchainedAPI;

    try {
      const maxAgeInDays = guestUserMaxAgeInDays ?? userSettings.guestUserMaxAgeInDays;
      const before = new Date(Date.now() - maxAgeInDays * ONE_DAY_IN_MILLISECONDS);

      const candidateIds = await modules.users.findGuestUserIds({ before });

      // A guest with a persistent session can keep a cart fresh without re-logging-in,
      // so `lastLogin` alone is insufficient. Exclude any guest whose cart was updated
      // at or after the cutoff. This cross-collection check lives in the worker/core
      // layer to keep the users module free of order dependencies.
      const recentCarts = candidateIds.length
        ? await modules.orders.findCarts(
            { userIds: candidateIds },
            { projection: { userId: 1, updated: 1 } },
          )
        : [];
      const userIdsWithRecentCart = new Set(
        recentCarts.filter((cart) => cart.updated && cart.updated >= before).map((c) => c.userId),
      );

      const userIdsToDelete = candidateIds.filter((id) => !userIdsWithRecentCart.has(id));

      let deletedGuestCount = 0;
      await Array.fromAsync(userIdsToDelete, async (userId) => {
        try {
          await services.users.deleteUser({ userId });
          deletedGuestCount += 1;
        } catch (err) {
          logger.warn(`Failed to garbage-collect guest ${userId}: ${err.message}`);
        }
      });

      return {
        success: true,
        result: {
          scannedGuestCount: candidateIds.length,
          deletedGuestCount,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
      };
    }
  },
};

export default GCGuestsWorker;

WorkerDirector.registerAdapter(GCGuestsWorker);

WorkerDirector.configureAutoscheduling({
  type: GCGuestsWorker.type,
  schedule: everyDayAtHalfPastTwo,
  // No input: doWork falls back to userSettings.guestUserMaxAgeInDays (default 30).
  retries: 2,
});
