import type { Modules } from '../modules.ts';
import { executeBulkOperation } from '@unchainedshop/utils';
import { removeFilterService } from './removeFilter.ts';

export async function bulkRemoveFiltersService(
  this: Modules,
  { filterIds }: { filterIds: string[] },
): Promise<{ successIds: string[]; failedIds: string[] }> {
  return executeBulkOperation(filterIds, async (filterId) => {
    const filter = await this.filters.findFilter({ filterId });
    if (!filter) throw new Error('not-found');
    await removeFilterService.call(this, { filter });
  });
}
