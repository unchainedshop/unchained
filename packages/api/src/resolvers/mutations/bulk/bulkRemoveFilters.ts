import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { createBulkOperationResult, normalizeBulkIds } from './bulkOperation.ts';

export default async function bulkRemoveFilters(
  root: never,
  { filterIds }: { filterIds: string[] },
  { services, userId }: Context,
) {
  log(`mutation bulkRemoveFilters for ${filterIds.length} filters`, { userId });

  const result = await services.filters.bulkRemoveFilters({
    filterIds: normalizeBulkIds(filterIds),
  });
  return createBulkOperationResult(result);
}
