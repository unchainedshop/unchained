import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { Filter, FilterText, FilterProductIdCacheRecord } from '@unchainedshop/types/filters.js';

export const FiltersCollection = async (db: mongodb.Db) => {
  const Filters = db.collection<Filter>('filters');
  const FilterTexts = db.collection<FilterText>('filter_texts');
  const FilterProductIdCache = db.collection<FilterProductIdCacheRecord>('filter_productId_cache');
  // Filter Indexes
  await buildDbIndexes(Filters, [
    { index: { isActive: 1 } },
    { index: { key: 1 }, options: { unique: true } },
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
