import {
  mongodb,
  buildDbIndexes,
  TimestampFields,
  isDocumentDBCompatModeEnabled,
} from '@unchainedshop/mongodb';

export enum FilterType {
  SWITCH = 'SWITCH',
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTI_CHOICE = 'MULTI_CHOICE',
  RANGE = 'RANGE',
}

export type Filter = {
  _id: string;
  isActive?: boolean;
  key: string;
  meta?: any;
  options: string[];
  type: FilterType;
} & TimestampFields;

export type FilterText = {
  _id: string;
  filterId: string;
  filterOptionValue: string | null;
  locale: string;
  subtitle?: string;
  title?: string;
} & TimestampFields;

export interface FilterProductIdCacheRecord {
  filterId: string;
  filterOptionValue: string | null;
  productIds: string[];
}

export const FiltersCollection = async (db: mongodb.Db) => {
  const Filters = db.collection<Filter>('filters');
  const FilterTexts = db.collection<FilterText>('filter_texts');
  const FilterProductIdCache = db.collection<FilterProductIdCacheRecord>('filter_productId_cache');
  // Filter Indexes

  if (!isDocumentDBCompatModeEnabled()) {
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
  }

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

  // FilterProductIdCache Indexes
  await buildDbIndexes(FilterProductIdCache, [{ index: { productIds: 1 } }, { index: { filterId: 1 } }]);

  return {
    Filters,
    FilterTexts,
    FilterProductIdCache,
  };
};
