import { SortOption } from '@unchainedshop/types/api.js';
import { Sort } from '@unchainedshop/types/common.js';

const SORT_DIRECTIONS = {
  ASC: 1,
  DESC: -1,
};

const buildSortOptions = (sort: Array<SortOption> = []): Sort => {
  const sortBy = {};
  sort?.forEach(({ key, value }) => {
    sortBy[key] = SORT_DIRECTIONS[value];
  });
  return sortBy;
};

export default buildSortOptions;
