import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';

export default async function bulkRemoveFilters(
  root: never,
  { filterIds }: { filterIds: string[] },
  { services, userId }: Context,
) {
  log(`mutation bulkRemoveFilters for ${filterIds.length} filters`, { userId });

  const { successIds, failedIds } = await services.filters.bulkRemoveFilters({ filterIds });

  return { successCount: successIds.length, failedCount: failedIds.length, failedIds };
}
