import type { Filter } from '@unchainedshop/core-filters';
import type { Modules } from '../modules.ts';
import { FilterDirector } from '../core-index.ts';

/*
 * Removing an option changes the filter's queryable shape. The invalidation rebuilds from the
 * filter's now-reduced options and prunes the retired option's cache row - which is what stops a
 * removed value from resolving to its frozen product ids (issue #721). See createFilterService.
 */
export async function removeFilterOptionService(
  this: Modules,
  { filterId, filterOptionValue }: { filterId: string; filterOptionValue: string },
): Promise<Filter | null> {
  const filter = await this.filters.removeFilterOption({ filterId, filterOptionValue });
  if (filter) {
    await FilterDirector.invalidateProductIdCache(filter, { modules: this });
  }
  return filter;
}
