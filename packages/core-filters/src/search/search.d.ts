import { FindOptions } from '@unchainedshop/types/common';
import { SearchQuery } from '@unchainedshop/types/filters';

export type CleanedSearchQuery = Omit<SearchQuery, 'query'> & {
  filterQuery: Record<string, Array<string>>;
};

export interface SearchConfiguration {
  query?: CleanedSearchQuery;
  filterSelector: Query;
  sortStage: FindOptions['sort'];
  forceLiveCollection: boolean;
}

export interface SearchProductConfiguration extends SearchConfiguration {
  productSelector: Query;
}

export interface SearchAssortmentConfiguration extends SearchConfiguration {
  assortmentSelector: Query;
}

export type FilterProductIds = (
  filter: Filter,
  params: { values: Array<string>; forceLiveCollection?: boolean },
  requestContext: Context,
) => Promise<Array<string>>;
