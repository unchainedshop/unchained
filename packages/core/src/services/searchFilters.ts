import type { Modules } from '../modules.ts';
import { SearchDirector, SearchEntityType } from '../directors/index.ts';
import type { FilterQuery } from '@unchainedshop/core-filters';
import type { SortOption } from '@unchainedshop/utils';

export async function searchFiltersService(
  this: Modules,
  queryString?: string,
  query: FilterQuery & { limit?: number; offset?: number; sort?: SortOption[] } = {},
) {
  if (!queryString) {
    return this.filters.findFilters(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchFilterIds = await searchActions.search(SearchEntityType.FILTER);
  if (searchFilterIds.length === 0) return [];

  return this.filters.findFilters({ ...query, searchFilterIds });
}

export async function searchFiltersCountService(
  this: Modules,
  queryString?: string,
  query: FilterQuery = {},
) {
  if (!queryString) {
    return this.filters.count(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchFilterIds = await searchActions.search(SearchEntityType.FILTER);
  if (searchFilterIds.length === 0) return 0;

  return this.filters.count({ ...query, searchFilterIds });
}
