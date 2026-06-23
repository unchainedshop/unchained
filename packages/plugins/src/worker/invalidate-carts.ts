import { type IWorkerAdapter, WorkerAdapter, WorkerDirector, schedule } from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:worker:invalidate-carts');

// Monthly, on the 1st at 00:00 *local* server time. Recalculating every
// recently-touched cart is expensive, so it runs off-peak via the work queue instead
// of blocking boot. Local time (not UTC) is deliberate: the scheduler evaluates crons
// against the server's local timezone, so the year-boundary run lands at local
// midnight on Jan 1 — the moment new-year tax rates take effect for that locale.
// Keep the server's TZ set to the relevant tax jurisdiction.
const firstOfMonthAtLocalMidnight = schedule.parse.cron('0 0 1 * *');

export const InvalidateCartsWorker: IWorkerAdapter<
  { maxAgeDays?: number },
  { scannedCartCount: number; recalculatedCartCount: number }
> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.invalidate-carts',
  label: 'Invalidate Carts',
  version: '1.0.0',
  type: 'INVALIDATE_CARTS',

  doWork: async ({ maxAgeDays } = {}, unchainedAPI) => {
    const { modules, services } = unchainedAPI;

    try {
      const orderIds = await modules.orders.findCartIdsToInvalidate(maxAgeDays);

      // Recalculate sequentially: a single cart already fans out into many Mongo
      // round-trips, so awaiting one cart at a time keeps the connection pool from
      // being saturated by a parallelized burst.
      let recalculatedCartCount = 0;
      for (const orderId of orderIds) {
        try {
          await services.orders.updateCalculation(orderId);
          recalculatedCartCount += 1;
        } catch (err) {
          logger.warn(`Failed to recalculate cart ${orderId}: ${err.message}`);
        }
      }

      return {
        success: true,
        result: {
          scannedCartCount: orderIds.length,
          recalculatedCartCount,
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

export default InvalidateCartsWorker;

WorkerDirector.registerAdapter(InvalidateCartsWorker);

WorkerDirector.configureAutoscheduling({
  type: InvalidateCartsWorker.type,
  schedule: firstOfMonthAtLocalMidnight,
  // No input: doWork falls back to findCartIdsToInvalidate's default max age (30 days).
  // Eventual recalculation: don't retry, the next scheduled run picks up any misses.
  retries: 0,
});
