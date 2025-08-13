import createFilter from './createFilter.js';
import updateFilter from './updateFilter.js';
import removeFilter from './removeFilter.js';
import getFilter from './getFilter.js';
import listFilters from './listFilters.js';
import countFilters from './countFilters.js';
import createFilterOption from './createFilterOption.js';
import removeFilterOption from './removeFilterOption.js';
import updateFilterTexts from './updateFilterTexts.js';
import getFilterTexts from './getFilterTexts.js';

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
