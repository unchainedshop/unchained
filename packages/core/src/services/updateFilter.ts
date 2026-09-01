import type { Filter } from '@unchainedshop/core-filters';
import type { Modules } from '../modules.ts';
import { FilterDirector } from '../core-index.ts';

/*
 * An update can change the key, type or options - all of which the product id cache is derived
 * from - so it always invalidates. See createFilterService for why the two live together.
 */
export async function updateFilterService(
  this: Modules,
  filterId: string,
  doc: Partial<Filter>,
): Promise<Filter | null> {
  const updatedFilter = await this.filters.update(filterId, doc);
  if (updatedFilter) {
    await FilterDirector.invalidateProductIdCache(updatedFilter, { modules: this });
  }
  return updatedFilter;
}
