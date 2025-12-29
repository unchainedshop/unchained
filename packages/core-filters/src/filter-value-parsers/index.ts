import { FilterType } from '../db/schema.ts';
import createRangeFilterParser from './range.ts';
import createSwitchFilterParser from './switch.ts';

export type FilterParser = (values: string[], allKeys: string[]) => (string | undefined)[];

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
