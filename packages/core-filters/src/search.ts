import type { SortOption, SortDirection } from '@unchainedshop/utils';

const ORDER_BY_INDEX = 'default';
const DIRECTION_DESCENDING: SortDirection = 'DESC';
const DIRECTION_ASCENDING: SortDirection = 'ASC';

export type SearchFilterQuery = { key: string; value?: string }[];

export interface SearchQuery {
  assortmentId?: string; // Single assortment to search within
  ignoreChildAssortments?: boolean; // If true, don't include products from child assortments
  assortmentIds?: string[];
  filterIds?: string[];
  filterQuery?: SearchFilterQuery;
  includeInactive?: boolean;
  orderBy?: string;
  productIds?: string[];
  queryString?: string;
}

// SortStage is now an array of SortOption for Drizzle ORM compatibility
export type SortStage = SortOption[];

export interface SearchConfiguration {
  searchQuery?: SearchQuery;
  filterSelector: FilterSelector;
  sortStage: SortStage;
  forceLiveCollection: boolean;
  locale: Intl.Locale;
  userId?: string;
}

export interface FilterQuery {
  filterIds?: string[];
  searchFilterIds?: string[];
  includeInactive?: boolean;
}

const normalizeDirection = (textualInput: string | undefined): SortDirection | null => {
  if (textualInput === DIRECTION_ASCENDING) {
    return DIRECTION_ASCENDING;
  }
  if (textualInput === DIRECTION_DESCENDING) {
    return DIRECTION_DESCENDING;
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
  _id?: string | string[];
  key?: string | string[];
  isActive?: boolean;
}

export const defaultFilterSelector = (searchQuery: SearchQuery): FilterSelector => {
  const { filterIds, filterQuery, includeInactive } = searchQuery;
  const selector: FilterSelector = {};
  const keys = (filterQuery || []).map((filter) => filter.key);

  if (filterIds) {
    // return explicit list because filters are preset by search
    selector._id = filterIds;
  } else if (keys.length > 0) {
    // return filters that are part of the filterQuery
    selector.key = keys;
  }

  if (!includeInactive) {
    // include only active filters
    selector.isActive = true;
  }

  return selector;
};

export const defaultSortStage = ({ orderBy }: { orderBy?: string }): SortStage => {
  if (!orderBy || orderBy === ORDER_BY_INDEX) {
    return [{ key: 'index', value: DIRECTION_ASCENDING }];
  }

  const orderBySlices = orderBy.split('_');
  const maybeDirection = orderBySlices.pop();

  const direction = normalizeDirection(maybeDirection);
  if (direction === null && maybeDirection) orderBySlices.push(maybeDirection);

  const keyPath = orderBySlices.join('.');

  const sortOptions: SortStage = [{ key: keyPath, value: direction ?? DIRECTION_ASCENDING }];

  // Add secondary sort by index if not already sorting by index
  if (keyPath !== 'index') {
    sortOptions.push({ key: 'index', value: DIRECTION_ASCENDING });
  }

  return sortOptions;
};

export const defaultAssortmentSelector = (
  query: {
    includeInactive?: boolean;
  } = { includeInactive: false },
) => {
  return !query.includeInactive ? { isActive: true } : {};
};
