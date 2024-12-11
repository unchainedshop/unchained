import { FilterType, Filter, SearchQuery } from '@unchainedshop/core-filters';
import { intersectSet } from '@unchainedshop/utils';
import { Modules } from '../modules.js';
import { FilterDirector, parseQueryArray } from '../directors/FilterDirector.js';

export const loadFilterOptionsService = async (
  filter: Filter,
  params: {
    searchQuery: SearchQuery;
    forceLiveCollection: boolean;
    productIdSet: Set<string>;
  },
  unchainedAPI: { modules: Modules },
) => {
  const { modules } = unchainedAPI;
  const { forceLiveCollection, productIdSet, searchQuery } = params;

  const filterQueryParsed = parseQueryArray(searchQuery?.filterQuery);
  const values = filterQueryParsed[filter.key];

  const allOptions = (filter.type === FilterType.SWITCH && ['true', 'false']) || filter.options || [];
  const mappedOptions = await Promise.all(
    allOptions.map(async (value) => {
      const filterOptionProductIds = await FilterDirector.filterProductIds(
        filter,
        {
          values: [value],
          forceLiveCollection,
        },
        unchainedAPI,
      );
      const filteredProductIdSet = intersectSet(productIdSet, new Set(filterOptionProductIds));

      const normalizedValues = values && modules.filters.parse(filter, values, [value]);
      const isSelected = normalizedValues && normalizedValues.indexOf(value) !== -1;

      if (!filteredProductIdSet.size && !isSelected) {
        return null;
      }

      return {
        filteredProductIdSet,
        searchQuery,
        value,
        filter,
        isSelected,
      };
    }),
  );
  return mappedOptions.filter(Boolean);
};
