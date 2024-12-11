import { FilterType } from '../db/FiltersCollection.js';
import createRangeFilterParser from './range.js';
import createSwitchFilterParser from './switch.js';

export type FilterParser = (values: Array<string>, allKeys: Array<string>) => Array<string | undefined>;

export default (type): FilterParser => {
  switch (type) {
    case FilterType.SWITCH:
      return createSwitchFilterParser;
    case FilterType.RANGE:
      return createRangeFilterParser;
    default:
      return (values /* , allKeys */) => values;
  }
};
