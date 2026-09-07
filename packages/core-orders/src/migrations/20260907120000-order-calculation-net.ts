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

export const convertOrderCalculationToNet = (
  calculation: PricingCalculation[],
): PricingCalculation[] => {
  let previousBaseRow: PricingCalculation | undefined;
  const attributed = calculation.map((row) => {
    if (!row || !Number.isFinite(row.amount)) {
      throw new Error('Calculation contains an invalid amount');
    }
    if (row.category !== 'TAXES') {
      previousBaseRow = row;
      return row;
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
    return { ...row, baseCategory, discountId, isNetPrice: false };
  });

  const converted = attributed.flatMap((row) => {
    if (row.category !== 'TAXES') return [row];
    // Preserve the original rows and their audit metadata. An offset turns the
    // category balance into net while the recorded tax remains a separate row.
    // Do not round or recalculate historical tax using today's rates.
    return [
      {
        category: row.baseCategory!,
        amount: -row.amount,
        discountId: row.discountId,
        isNetPrice: true,
        meta: row.meta,
      },
      row,
    ];
  });

  const sum = (rows: PricingCalculation[], category?: string, discountId?: string) =>
    rows.reduce(
      (total, row) =>
        (category === undefined || row.category === category) &&
        (discountId === undefined || row.discountId === discountId)
          ? total + row.amount
          : total,
      0,
    );
  const taxes = attributed.filter((row) => row.category === 'TAXES');
  const taxSum = (category?: string, discountId?: string) =>
    sum(
      category === undefined ? taxes : taxes.filter((row) => row.baseCategory === category),
      undefined,
      discountId,
    );
  const categories = [
    ...new Set(attributed.map((row) => (row.category === 'TAXES' ? row.baseCategory! : row.category))),
  ];
  const discountIds = [...new Set(attributed.map((row) => row.discountId))].filter(
    (discountId): discountId is string => discountId !== undefined,
  );
  // Global adjustments must not change an existing custom category balance.
  let roundingCategory = 'ROUNDING';
  while (categories.includes(roundingCategory)) roundingCategory = `_${roundingCategory}`;

  // Floating-point cancellation is not associative. Preserve the legacy sum
  // minus tax for every public scope, so half-cent prices keep their charged
  // amount. These ordinary additive rows need no special runtime reader.
  const scopes = [
    ...categories.flatMap((category) => [
      ...discountIds.map((discountId) => ({ category, discountId })),
      { category, discountId: undefined },
    ]),
    ...discountIds.map((discountId) => ({ category: undefined, discountId })),
    { category: undefined, discountId: undefined },
  ];
  const balances = scopes.map(({ category, discountId }) => ({
    category,
    discountId,
    amount: sum(attributed, category, discountId) - taxSum(category, discountId),
  }));
  for (const { category, discountId, amount } of balances) {
    const difference = amount - sum(converted, category, discountId);
    if (!Number.isFinite(amount) || !Number.isFinite(difference)) {
      throw new Error('Calculation contains an invalid balance');
    }
    if (difference) {
      converted.push({
        category: category ?? roundingCategory,
        discountId,
        amount: difference,
        isNetPrice: true,
        meta: { migration: 20260907120000, reason: 'Preserve historical floating-point balance' },
      });
    }
  }

  // Verify the completed conversion before its atomic write. A custom history
  // with contradictory totals must be repaired, never silently charged anew.
  for (const { category, discountId, amount } of balances) {
    if (sum(converted, category, discountId) !== amount) {
      throw new Error(
        `Cannot preserve historical balance for ${category ?? 'order'} ${discountId ?? ''}`,
      );
    }
  }
  for (const discountId of discountIds) {
    const before = sum(attributed, 'DISCOUNTS', discountId);
    const after = sum(converted, 'DISCOUNTS', discountId) + taxSum('DISCOUNTS', discountId);
    if (Math.round(before) !== Math.round(after) || Boolean(before) !== Boolean(after)) {
      throw new Error(`Cannot preserve historical discount ${discountId}`);
    }
  }
  return converted;
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
          calculation = convertOrderCalculationToNet(order.calculation);
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
