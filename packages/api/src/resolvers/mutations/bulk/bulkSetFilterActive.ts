import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { createBulkOperationResult, normalizeBulkIds } from './bulkOperation.ts';

export default async function bulkSetFilterActive(
  root: never,
  { filterIds, isActive }: { filterIds: string[]; isActive: boolean },
  { services, userId }: Context,
) {
  log(`mutation bulkSetFilterActive ${isActive} for ${filterIds.length} filters`, { userId });

  const result = await services.filters.bulkSetFilterActive({
    filterIds: normalizeBulkIds(filterIds),
    isActive,
  });
  return createBulkOperationResult(result);
}
