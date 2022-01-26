import { Query } from '@unchainedshop/types/common';
import { SearchFilterQuery } from '@unchainedshop/types/filters';

// maps each key value pair into a single string
export const parseQueryArray = (query: SearchFilterQuery) =>
  (query || []).reduce(
    (accumulator, { key, value }) => ({
      ...accumulator,
      [key]: accumulator[key] ? accumulator[key].concat(value) : [value],
    }),
    {},
  );
