import { FilterType } from '../db/FilterType';
import createRangeFilterParser from './range';
import createSwitchFilterParser from './switch';

export default (type) => {
  switch (type) {
    case FilterType.SWITCH:
      return createSwitchFilterParser;
    case FilterType.RANGE:
      return createRangeFilterParser;
    default:
      return (values /* , allKeys */) => values;
  }
};
