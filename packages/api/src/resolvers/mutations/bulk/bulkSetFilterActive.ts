import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';

export default async function bulkSetFilterActive(
  root: never,
  { filterIds, isActive }: { filterIds: string[]; isActive: boolean },
  { modules, userId }: Context,
) {
  log(`mutation bulkSetFilterActive ${isActive} for ${filterIds.length} filters`, { userId });

  const modifiedCount = await modules.filters.bulkSetActive(filterIds, isActive);

  const failedCount = filterIds.length - modifiedCount;
  return { successCount: modifiedCount, failedCount, failedIds: [] };
}
