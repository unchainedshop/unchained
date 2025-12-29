import type { Filter } from './db/schema.ts';

const ORDER_BY_INDEX = 'default';
const DIRECTION_DESCENDING = 'DESC';
const DIRECTION_ASCENDING = 'ASC';

export type SearchFilterQuery = { key: string; value?: string }[];

export interface SearchQuery {
  assortmentIds?: string[];
  filterIds?: string[];
  filterQuery?: SearchFilterQuery;
  includeInactive?: boolean;
  orderBy?: string;
  productIds?: string[];
  queryString?: string;
}

// Sort type compatible with MongoDB's Sort without importing MongoDB
// This is intentionally permissive to work with MongoDB types in downstream code
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SortStage = any;

export interface SearchConfiguration {
  searchQuery?: SearchQuery;
  filterSelector: Record<string, unknown>;
  sortStage: SortStage;
  forceLiveCollection: boolean;
  locale: Intl.Locale;
  userId?: string;
}

export interface FilterQuery {
  filterIds?: string[];
  queryString?: string;
  includeInactive?: boolean;
}

const normalizeDirection = (textualInput: string | undefined) => {
  if (textualInput === DIRECTION_ASCENDING) {
    return 1;
  }
  if (textualInput === DIRECTION_DESCENDING) {
    return -1;
  }
  return null;
};

export const defaultProductSelector = ({ includeInactive }: SearchQuery, { modules }: any) => {
  const selector = !includeInactive
    ? modules.products.search.buildActiveStatusFilter()
    : modules.products.search.buildActiveDraftStatusFilter();
  return selector;
};

export interface FilterSelector {
  _id?: string | { $in: string[] };
  key?: string | { $in: string[] };
  isActive?: boolean;
}

export const defaultFilterSelector = (searchQuery: SearchQuery): FilterSelector => {
  const { filterIds, filterQuery, includeInactive } = searchQuery;
  const selector: FilterSelector = {};
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

export const defaultSortStage = ({ orderBy }: { orderBy?: string }): SortStage => {
  if (!orderBy || orderBy === ORDER_BY_INDEX) {
    return {
      index: 1,
    };
  }

  const orderBySlices = orderBy.split('_');
  const maybeDirection = orderBySlices.pop();

  const direction = normalizeDirection(maybeDirection);
  if (direction === null && maybeDirection) orderBySlices.push(maybeDirection);

  const keyPath = orderBySlices.join('.');

  return {
    [keyPath]: direction === null ? 1 : direction,
    ['index']: 1,
  };
};

export const defaultAssortmentSelector = (
  query: {
    includeInactive?: boolean;
  } = { includeInactive: false },
) => {
  return !query.includeInactive ? { isActive: true } : {};
};
