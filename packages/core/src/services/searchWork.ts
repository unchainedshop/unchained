import type { Modules } from '../modules.ts';
import { SearchDirector, SearchEntityType } from '../directors/index.ts';
import type { Work, WorkQueueQuery } from '@unchainedshop/core-worker';
import type { SortOption } from '@unchainedshop/utils';

export async function searchWorkService(
  this: Modules,
  queryString?: string,
  query: WorkQueueQuery = {},
  options: { limit?: number; offset?: number; sort?: SortOption[] } = {},
): Promise<Work[]> {
  if (!queryString) {
    return this.worker.findWorkQueue({
      ...query,
      limit: options.limit,
      skip: options.offset,
      sort: options.sort,
    });
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchWorkIds = await searchActions.search(SearchEntityType.WORK_QUEUE);
  if (searchWorkIds.length === 0) return [];

  return this.worker.findWorkQueue({
    ...query,
    searchWorkIds,
    limit: options.limit,
    skip: options.offset,
    sort: options.sort,
  });
}

export async function searchWorkCountService(
  this: Modules,
  queryString?: string,
  query: WorkQueueQuery = {},
): Promise<number> {
  if (!queryString) {
    return this.worker.count(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchWorkIds = await searchActions.search(SearchEntityType.WORK_QUEUE);
  if (searchWorkIds.length === 0) return 0;

  return this.worker.count({ ...query, searchWorkIds });
}
