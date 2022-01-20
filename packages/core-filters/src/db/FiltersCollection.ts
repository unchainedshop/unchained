import { Db } from '@unchainedshop/types/common';
import { buildDbIndexes } from 'meteor/unchained:utils';
import { Filter, FilterText } from '@unchainedshop/types/filters';

export const FiltersCollection = async (db: Db) => {
  const Filters = db.collection<Filter>('filters');
  const FilterTexts = db.collection<FilterText>('filter_texts');

  // Filter Indexes
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

  return {
    Filters,
    FilterTexts,
  };
};