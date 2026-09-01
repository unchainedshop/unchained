import { mongodb, buildDbIndexes, type TimestampFields } from '@unchainedshop/mongodb';

export const FilterType = {
  SWITCH: 'SWITCH',
  SINGLE_CHOICE: 'SINGLE_CHOICE',
  MULTI_CHOICE: 'MULTI_CHOICE',
  RANGE: 'RANGE',
} as const;

export type FilterType = (typeof FilterType)[keyof typeof FilterType];

export type Filter = {
  _id: string;
  isActive?: boolean;
  key: string;
  meta?: any;
  options: string[];
  type: FilterType;
} & TimestampFields;

/*
 * The set of values a filter can be queried by, and thus the keys of its product id cache:
 * a SWITCH is not backed by options but by the two boolean states, every other type is
 * defined by its options.
 */
export const filterOptionValues = (filter: Pick<Filter, 'type' | 'options'>): string[] =>
  filter.type === FilterType.SWITCH ? ['true', 'false'] : filter.options || [];

/*
 * How current a cached result is, taken from the filter itself rather than from a counter of its
 * own: every mutation stamps `updated`, so a rebuild that started before one has an older
 * generation than the filter it ends up writing against.
 *
 * Deliberately coarse. A change that leaves the cache perfectly valid still moves it, which only
 * costs a skipped write - and the mutation that moved it queues an invalidation anyway. Being
 * wrong in the other direction would publish results computed against a filter that no longer
 * exists in that shape.
 */
export const filterCacheGeneration = (filter: Pick<Filter, 'updated' | 'created'>): number => {
  // Documents written outside the module API can carry string timestamps; the ordering is the
  // same either way, and anything unparseable degrades to generation 0 - always rebuildable.
  const stamp = filter?.updated ?? filter?.created;
  const time = stamp ? new Date(stamp).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
};

export type FilterText = {
  _id: string;
  filterId: string;
  filterOptionValue: string | null;
  locale: string;
  subtitle?: string;
  title?: string;
} & TimestampFields;

export const FiltersCollection = async (db: mongodb.Db) => {
  const Filters = db.collection<Filter>('filters');
  const FilterTexts = db.collection<FilterText>('filter_texts');
  await buildDbIndexes(Filters, [
    {
      index: { _id: 'text', key: 'text', options: 'text' },
      options: {
        weights: {
          _id: 8,
          key: 6,
          options: 5,
        },
        name: 'filters_fulltext_search',
      },
    },
  ]);

  await buildDbIndexes(Filters, [
    { index: { isActive: 1 } },
    { index: { key: 1 }, options: { unique: true } },
  ]);

  // FilterTexts indexes
  await buildDbIndexes(FilterTexts, [
    { index: { filterId: 1 } },
    { index: { filterOptionValue: 1 } },
    {
      index: {
        filterId: 1,
        filterOptionValue: 1,
        locale: 1,
      },
    },
  ]);

  // The product id cache is the storage of one pluggable cache backend (see filtersSettings), so
  // its collection and indexes are owned by that backend - product-cache/mongodb.ts - not by this
  // factory. A shop running a Redis/HTTP backend must not have this Mongo collection provisioned
  // underneath it.

  return {
    Filters,
    FilterTexts,
  };
};
