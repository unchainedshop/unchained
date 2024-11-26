import { Filter, SearchQuery } from '../types.js';
import { mongodb } from '@unchainedshop/mongodb';
import type { Product } from '@unchainedshop/core-products';
import type { Assortment } from '@unchainedshop/core-assortments';

export type CleanedSearchQuery = Omit<SearchQuery, 'query'> & {
  filterQuery: Record<string, Array<string>>;
};

export interface SearchConfiguration {
  query?: CleanedSearchQuery;
  filterSelector: mongodb.Filter<Filter>;
  sortStage: mongodb.FindOptions['sort'];
  forceLiveCollection: boolean;
}

export interface SearchProductConfiguration extends SearchConfiguration {
  productSelector: mongodb.Filter<Product>;
}

export interface SearchAssortmentConfiguration extends SearchConfiguration {
  assortmentSelector: mongodb.Filter<Assortment>;
}

export type FilterProductIds = (
  filter: Filter,
  params: { values: Array<string>; forceLiveCollection?: boolean },
  unchainedAPI,
) => Promise<Array<string>>;
