import { SearchQuery } from '@unchainedshop/types/filters.js';
import { parseQueryArray } from '../utils/parseQueryArray.js';
import { CleanedSearchQuery } from './search.js';

// TODO: Fix type searchQuery

export const cleanQuery = ({
  filterQuery,
  assortmentIds = null,
  productIds = null,
  ...query
}: SearchQuery): CleanedSearchQuery => ({
  filterQuery: parseQueryArray(filterQuery),
  productIds: Promise.resolve(productIds),
  assortmentIds: Promise.resolve(assortmentIds),
  ...query,
});
