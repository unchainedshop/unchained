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

      // Staleness is decided purely on the user document (`created` / `lastLogin`),
      // see `findGuestUserIds`. Cart freshness is deliberately NOT a reprieve: the
      // INVALIDATE_CARTS sweep recalculates recently-touched carts on every boot, so
      // a guest's cart `updated` is kept artificially fresh and would keep dormant
      // guests alive forever. A collected guest's open carts are cascade-deleted by
      // deleteUserService, so the stale cart goes with it.
      const userIdsToDelete = await modules.users.findGuestUserIds({ before });

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
          scannedGuestCount: userIdsToDelete.length,
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
  retries: 0,
});
