import { mongodb } from '@unchainedshop/mongodb';
import { Filter } from '../db/FiltersCollection.js';

export type SearchFilterQuery = Array<{ key: string; value?: string }>;

export type SearchQuery = {
  assortmentIds?: Array<string>;
  filterIds?: Array<string>;
  filterQuery?: SearchFilterQuery;
  includeInactive?: boolean;
  orderBy?: string;
  productIds?: Array<string>;
  queryString?: string;
};

export type CleanedSearchQuery = Omit<SearchQuery, 'query' | 'filterQuery'> & {
  filterQuery: Record<string, Array<string>>;
};

export interface SearchConfiguration {
  query?: CleanedSearchQuery;
  filterSelector: mongodb.Filter<Filter>;
  sortStage: mongodb.FindOptions['sort'];
  forceLiveCollection: boolean;
}

export type FilterProductIds = (
  filter: Filter,
  params: { values: Array<string>; forceLiveCollection?: boolean },
  unchainedAPI,
) => Promise<Array<string>>;

export type FilterQuery = {
  filterIds?: Array<string>;
  queryString?: string;
  includeInactive?: boolean;
};
