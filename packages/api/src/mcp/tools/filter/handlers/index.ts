import createFilter from './createFilter.ts';
import updateFilter from './updateFilter.ts';
import removeFilter from './removeFilter.ts';
import getFilter from './getFilter.ts';
import listFilters from './listFilters.ts';
import countFilters from './countFilters.ts';
import createFilterOption from './createFilterOption.ts';
import removeFilterOption from './removeFilterOption.ts';
import updateFilterTexts from './updateFilterTexts.ts';
import getFilterTexts from './getFilterTexts.ts';

export default {
  CREATE: createFilter,
  UPDATE: updateFilter,
  REMOVE: removeFilter,
  GET: getFilter,
  LIST: listFilters,
  COUNT: countFilters,
  CREATE_OPTION: createFilterOption,
  REMOVE_OPTION: removeFilterOption,
  UPDATE_TEXTS: updateFilterTexts,
  GET_TEXTS: getFilterTexts,
};
