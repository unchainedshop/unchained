import { mongodb } from '@unchainedshop/mongodb';
import { Filter } from './db/FiltersCollection.js';

const ORDER_BY_INDEX = 'default';
const DIRECTION_DESCENDING = 'DESC';
const DIRECTION_ASCENDING = 'ASC';

const { AMAZON_DOCUMENTDB_COMPAT_MODE } = process.env;

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
export interface SearchConfiguration {
  searchQuery?: SearchQuery;
  filterSelector: mongodb.Filter<Filter>;
  sortStage: mongodb.FindOptions['sort'];
  forceLiveCollection: boolean;
}

export type FilterQuery = {
  filterIds?: Array<string>;
  queryString?: string;
  includeInactive?: boolean;
};

const normalizeDirection = (textualInput) => {
  if (textualInput === DIRECTION_ASCENDING) {
    return 1;
  }
  if (textualInput === DIRECTION_DESCENDING) {
    return -1;
  }
  return null;
};

export const defaultProductSelector = ({ includeInactive }: SearchQuery, { modules }) => {
  const selector = !includeInactive
    ? modules.products.search.buildActiveStatusFilter()
    : modules.products.search.buildActiveDraftStatusFilter();
  return selector;
};

export const defaultFilterSelector = (searchQuery: SearchQuery) => {
  const { filterIds, filterQuery, includeInactive } = searchQuery;
  const selector: mongodb.Filter<Filter> = {};
  const keys = (filterQuery || []).map((filter) => filter.key);

  if (filterIds) {
    // return explicit list because filters are preset by search
    selector._id = { $in: filterIds };
  } else if (keys.length > 0) {
    // return filters that are part of the filterQuery
    selector.key = { $in: keys };
  }

  if (!includeInactive) {
    // include only active filters
    selector.isActive = true;
  }

  return selector;
};

export const defaultSortStage = ({ orderBy }: { orderBy?: string }): mongodb.FindOptions['sort'] => {
  if (!orderBy || orderBy === ORDER_BY_INDEX) {
    if (AMAZON_DOCUMENTDB_COMPAT_MODE) {
      return {
        sequence: 1,
      };
    }
    return {
      index: 1,
    };
  }

  const orderBySlices = orderBy.split('_');
  const maybeDirection = orderBySlices.pop();

  const direction = normalizeDirection(maybeDirection);
  if (direction === null) orderBySlices.push(maybeDirection);

  const keyPath = orderBySlices.join('.');

  return {
    [keyPath]: direction === null ? 1 : direction,
    [AMAZON_DOCUMENTDB_COMPAT_MODE ? 'sequence' : 'index']: 1,
  };
};

export const defaultAssortmentSelector = (
  query: {
    includeInactive?: boolean;
  } = { includeInactive: false },
) => {
  return !query.includeInactive ? { isActive: true } : {};
};
