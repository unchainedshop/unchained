import type { Filter } from '@unchainedshop/core-filters';
import type { Modules } from '../modules.ts';
import { FilterDirector } from '../core-index.ts';

/*
 * Adding an option changes the filter's queryable shape, so it invalidates the product id cache.
 * See createFilterService for why the mutation and the invalidation live together.
 */
export async function createFilterOptionService(
  this: Modules,
  filterId: string,
  { value }: { value: string },
): Promise<Filter | null> {
  const filter = await this.filters.createFilterOption(filterId, { value });
  if (filter) {
    await FilterDirector.invalidateProductIdCache(filter, { modules: this });
  }
  return filter;
}
