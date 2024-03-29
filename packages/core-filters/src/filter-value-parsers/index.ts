import { FilterType } from '../db/FilterType.js';
import createRangeFilterParser from './range.js';
import createSwitchFilterParser from './switch.js';

type FilterParser = (values: Array<string>, allKeys: Array<string>) => any;

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
