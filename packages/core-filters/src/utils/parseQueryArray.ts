import { SearchFilterQuery } from '../types.js';

// maps each key value pair into a single string
export const parseQueryArray = (query: SearchFilterQuery): Record<string, Array<string>> =>
  (query || []).reduce(
    (accumulator, { key, value }) => ({
      ...accumulator,
      [key]: accumulator[key] ? accumulator[key].concat(value) : [value],
    }),
    {},
  );
