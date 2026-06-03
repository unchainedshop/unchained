import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';

export default async function bulkSetAssortmentActive(
  root: never,
  { assortmentIds, isActive }: { assortmentIds: string[]; isActive: boolean },
  { modules, userId }: Context,
) {
  log(`mutation bulkSetAssortmentActive ${isActive} for ${assortmentIds.length} assortments`, {
    userId,
  });

  const modifiedCount = await modules.assortments.bulkSetActive(assortmentIds, isActive);

  if (modifiedCount > 0) {
    await modules.assortments.invalidateCache({ assortmentIds }, { skipUpstreamTraversal: false });
  }

  const failedCount = assortmentIds.length - modifiedCount;
  return { successCount: modifiedCount, failedCount, failedIds: [] };
}
