import { FilterType, Filter, SearchQuery } from '@unchainedshop/core-filters';
import { Modules } from '../modules.js';
import { FilterDirector, parseQueryArray } from '../directors/FilterDirector.js';

export async function loadFilterOptionsService(
  this: Modules,
  filter: Filter,
  params: {
    searchQuery: SearchQuery;
    forceLiveCollection: boolean;
    productIdSet: Set<string>;
  },
) {
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
        { modules: this },
      );
      const filteredProductIdSet = productIdSet.intersection(filterOptionProductIds);

      const normalizedValues = values && this.filters.parse(filter, values, [value]);
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
}
