import type { Filter } from '@unchainedshop/core-filters';
import type { Modules } from '../modules.ts';
import { FilterDirector } from '../core-index.ts';

/*
 * Creating a filter and priming its product id cache belong together: the cache is derived from
 * the filter's queryable shape, so anything that creates or changes that shape has to invalidate.
 * Keeping the pair in one service means no API surface can do one without the other.
 */
export async function createFilterService(
  this: Modules,
  filter: Parameters<Modules['filters']['create']>[0],
): Promise<Filter> {
  const newFilter = await this.filters.create(filter);
  await FilterDirector.invalidateProductIdCache(newFilter, { modules: this });
  return newFilter;
}
