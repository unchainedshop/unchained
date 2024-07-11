import { UnchainedCore } from '@unchainedshop/types/core.js';
import { Filter, SearchQuery } from '@unchainedshop/types/filters.js';
import { mongodb } from '@unchainedshop/mongodb';
import { Product } from '@unchainedshop/types/products.js';
import { Assortment } from '@unchainedshop/types/assortments.js';

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
  unchainedAPI: UnchainedCore,
) => Promise<Array<string>>;
