import type { Modules } from '../modules.ts';
import { SearchDirector } from '../directors/index.ts';
import type { AssortmentQuery } from '@unchainedshop/core-assortments';
import type { SortOption } from '@unchainedshop/utils';

export async function searchAssortmentsSimpleService(
  this: Modules,
  queryString?: string,
  query: Omit<AssortmentQuery, 'queryString'> & {
    limit?: number;
    offset?: number;
    sort?: SortOption[];
  } = {},
) {
  if (!queryString) {
    return this.assortments.findAssortments(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchAssortmentIds = await searchActions.searchAssortments();
  if (searchAssortmentIds.length === 0) return [];

  return this.assortments.findAssortments({ ...query, searchAssortmentIds });
}

export async function searchAssortmentsSimpleCountService(
  this: Modules,
  queryString?: string,
  query: Omit<AssortmentQuery, 'queryString'> = {},
) {
  if (!queryString) {
    return this.assortments.count(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchAssortmentIds = await searchActions.searchAssortments();
  if (searchAssortmentIds.length === 0) return 0;

  return this.assortments.count({ ...query, searchAssortmentIds });
}
