import type { Modules } from '../modules.ts';
import { removeFilterService } from './removeFilter.ts';

export async function bulkRemoveFiltersService(
  this: Modules,
  { filterIds }: { filterIds: string[] },
): Promise<{ successIds: string[]; failedIds: string[] }> {
  const successIds: string[] = [];
  const failedIds: string[] = [];

  const filters = await Promise.all(filterIds.map((filterId) => this.filters.findFilter({ filterId })));

  const results = await Promise.allSettled(
    filters.map(async (filter, index) => {
      if (!filter) throw new Error('not-found');
      await removeFilterService.call(this, { filter });
      return filterIds[index];
    }),
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successIds.push(result.value);
    } else {
      failedIds.push(filterIds[index]);
    }
  });

  return { successIds, failedIds };
}
