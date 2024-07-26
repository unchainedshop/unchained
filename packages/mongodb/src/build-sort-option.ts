import { SortOption } from '@unchainedshop/utils';
import type { Sort } from 'mongodb';

const SORT_DIRECTIONS = {
  ASC: 1,
  DESC: -1,
};

export const buildSortOptions = (sort: Array<SortOption> = []): Sort => {
  const sortBy = {};
  sort?.forEach(({ key, value }) => {
    sortBy[key] = SORT_DIRECTIONS[value];
  });
  return sortBy;
};

export default buildSortOptions;
