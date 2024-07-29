import { SearchQuery } from '../types.js';
import { parseQueryArray } from '../utils/parseQueryArray.js';
import { CleanedSearchQuery } from './search.js';

export const cleanQuery = ({ filterQuery, ...query }: SearchQuery) =>
  ({
    filterQuery: parseQueryArray(filterQuery),
    ...query,
  }) as CleanedSearchQuery;
