import { FindOptions } from '@unchainedshop/types/common';
import { FilterCache, SearchQuery } from '@unchainedshop/types/filters';

export type CleanedFilterCache = Omit<FilterCache, 'productIds'> & {
  productIds: Record<string, Array<string>>;
};

export type CleanedSearchQuery = Omit<SearchQuery, 'query'> & {
  filterQuery: Record<string, Array<sting>>;
};

export interface SearchConfiguration {
  query?: CleanedSearchQuery;
  filterSelector: Query;
  productSelector: Query;
  sortStage: FindOptions['sort'];
  forceLiveCollection: boolean;
}

export type FilterProductIds = (
  filter: Filter,
  params: { values: Array<string>; forceLiveCollection?: boolean },
  requestContext: Context
) => Promise<Array<string>>;
