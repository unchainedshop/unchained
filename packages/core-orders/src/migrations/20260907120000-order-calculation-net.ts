import type { MigrationRepository } from '@unchainedshop/mongodb';
import type { PricingCalculation } from '@unchainedshop/utils';
import { OrdersCollection } from '../db/OrdersCollection.ts';

// Net rows are marked by OrderPricingSheet, including calculations already written
// by the net-pricing release. Keep the format check confined to this migration.
const legacyCalculationSelector = {
  'calculation.0': { $exists: true },
  calculation: {
    $not: { $elemMatch: { category: { $ne: 'TAXES' }, isNetPrice: true } },
  },
};

const convertCalculation = (calculation: PricingCalculation[]): PricingCalculation[] => {
  let previousBaseRow: PricingCalculation | undefined;
  return calculation.flatMap((row) => {
    if (!row || !Number.isFinite(row.amount)) {
      throw new Error('Calculation contains an invalid amount');
    }
    if (row.category !== 'TAXES') {
      previousBaseRow = row;
      return [row];
    }

    // Older calculations omitted tax attribution. The built-in order adapters
    // write taxes immediately after the category row they belong to.
    const baseCategory = row.baseCategory || previousBaseRow?.category;
    if (!baseCategory || baseCategory === 'TAXES') {
      throw new Error('Cannot determine the base category of a tax row');
    }
    const discountId =
      row.discountId ??
      (previousBaseRow?.category === baseCategory ? previousBaseRow.discountId : undefined);
    const tax = { ...row, baseCategory, discountId, isNetPrice: false };

    // Preserve the original rows and their audit metadata. An offset turns the
    // category balance into net while the recorded tax remains a separate row.
    // Do not round or recalculate historical tax using today's rates.
    return [
      {
        category: baseCategory,
        amount: -row.amount,
        discountId,
        isNetPrice: true,
        meta: row.meta,
      },
      tax,
    ];
  });
};

export default function migrateOrderCalculationToNet(repository: MigrationRepository) {
  repository?.register({
    id: 20260907120000,
    name: 'Convert persisted order calculations from gross to net category balances',
    up: async ({ logger }) => {
      const Orders = await OrdersCollection(repository.db);
      const projection = { _id: 1, calculation: 1 };
      let migrated = 0;

      // Include carts and every historical order status, without loading the
      // whole collection into memory.
      for await (const order of Orders.find(legacyCalculationSelector, { projection })) {
        let calculation: PricingCalculation[];
        try {
          calculation = convertCalculation(order.calculation);
        } catch (error) {
          throw new Error(`Cannot migrate order ${order._id}: ${error.message}`, { cause: error });
        }
        if (!calculation.some((row) => row.isNetPrice === true)) {
          // A tax-free calculation is already both net and gross.
          calculation = calculation.map((row) => ({ ...row, isNetPrice: true }));
        }

        // Atomically store the offsets and marker. A retry cannot subtract tax
        // twice, and a simultaneous recalculation must not be overwritten.
        const result = await Orders.updateOne(
          { _id: order._id, calculation: order.calculation },
          { $set: { calculation } },
        );
        if (result.matchedCount) {
          migrated += 1;
        } else if (
          await Orders.findOne({ _id: order._id, ...legacyCalculationSelector }, { projection })
        ) {
          throw new Error(
            `Order ${order._id} changed during migration; retry after stopping old writers`,
          );
        }
      }

      logger?.info(`Converted ${migrated} order calculation(s) to net category balances`);
    },
  });
}
