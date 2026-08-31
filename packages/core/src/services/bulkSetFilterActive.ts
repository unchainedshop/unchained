import type { Modules } from '../modules.ts';
import { executeBulkOperation } from '@unchainedshop/utils';
import { updateFilterService } from './updateFilter.ts';

export async function bulkSetFilterActiveService(
  this: Modules,
  { filterIds, isActive }: { filterIds: string[]; isActive: boolean },
): Promise<{ successIds: string[]; failedIds: string[] }> {
  return executeBulkOperation(filterIds, async (filterId) => {
    const filter = await this.filters.findFilter({ filterId });
    if (!filter) throw new Error('not-found');
    if (!(await updateFilterService.call(this, filterId, { isActive }))) {
      throw new Error('update-failed');
    }
  });
}
