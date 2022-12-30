import { SearchQuery } from '@unchainedshop/types/filters';
import { parseQueryArray } from "../utils/parseQueryArray.js";
import { CleanedSearchQuery } from './search';

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
