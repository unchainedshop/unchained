import type { Modules } from '../modules.ts';
import { SearchDirector, SearchEntityType } from '../directors/index.ts';
import type { WarehousingProviderQuery } from '@unchainedshop/core-warehousing';

export async function searchWarehousingProvidersService(
  this: Modules,
  queryString?: string,
  query: WarehousingProviderQuery = {},
) {
  if (!queryString) {
    return this.warehousing.findProviders(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchWarehousingProviderIds = await searchActions.search(SearchEntityType.WAREHOUSING_PROVIDER);
  if (searchWarehousingProviderIds.length === 0) return [];

  return this.warehousing.findProviders({ ...query, searchWarehousingProviderIds });
}

export async function searchWarehousingProvidersCountService(
  this: Modules,
  queryString?: string,
  query: WarehousingProviderQuery = {},
) {
  if (!queryString) {
    return this.warehousing.count(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchWarehousingProviderIds = await searchActions.search(SearchEntityType.WAREHOUSING_PROVIDER);
  if (searchWarehousingProviderIds.length === 0) return 0;

  return this.warehousing.count({ ...query, searchWarehousingProviderIds });
}
