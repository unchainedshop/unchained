import { intersectSet } from '../utils/intersectSet.js';
import { FilterProductIds } from './search.js';
import createFilterValueParser from '../filter-value-parsers/index.js';
import { Filter, FilterType } from '../db/FiltersCollection.js';

const findLoadedOptions = async (
  filter: Filter,
  params: {
    forceLiveCollection: boolean;
    productIdSet: Set<string>;
    values: Array<string>;
  },
  filterProductIds: FilterProductIds,
  filterActions: {
    aggregateProductIds: (aggregationParams: { productIds: Array<string> }) => Array<string>;
  },
  unchainedAPI,
) => {
  const { values, forceLiveCollection, productIdSet } = params;
  const parse = createFilterValueParser(filter.type);

  const allOptions = (filter.type === FilterType.SWITCH && ['true', 'false']) || filter.options || [];
  const mappedOptions = await Promise.all(
    allOptions.map(async (value) => {
      const filterOptionProductIds = await filterProductIds(
        filter,
        {
          values: [value],
          forceLiveCollection,
        },
        unchainedAPI,
      );
      const filteredProductIds = intersectSet(productIdSet, new Set(filterOptionProductIds));
      const normalizedValues = values && parse(values, [value]);
      const isSelected = normalizedValues && normalizedValues.indexOf(value) !== -1;

      if (!filteredProductIds.size && !isSelected) {
        return null;
      }
      const filteredProductsCount = () =>
        filterActions.aggregateProductIds({
          productIds: [...filteredProductIds],
        }).length;

      return {
        definition: { filterOption: value, ...filter },
        filteredProductsCount,
        isSelected,
      };
    }),
  );
  return mappedOptions.filter(Boolean);
};

export const loadFilter = async (
  filter: Filter,
  params: {
    allProductIds: Array<string>;
    filterQuery: Record<string, Array<string>>;
    forceLiveCollection: boolean;
    otherFilters: Array<Filter>;
  },
  filterProductIds: FilterProductIds,
  filterActions: {
    aggregateProductIds: (aggregationParams: { productIds: Array<string> }) => Array<string>;
  },
  unchainedAPI,
) => {
  const { allProductIds, filterQuery, forceLiveCollection, otherFilters } = params;

  const values = filterQuery[filter.key];

  // The examinedProductIdSet is a set of product id's that:
  // - Fit this filter generally
  // - Are part of the preselected product id array
  const filteredProductIds = await filterProductIds(
    filter,
    {
      values: [undefined],
      forceLiveCollection,
    },
    unchainedAPI,
  );

  const examinedProductIdSet = intersectSet(new Set(allProductIds), new Set(filteredProductIds));

  // The filteredProductIdSet is a set of product id's that:
  // - Are filtered by all other filters
  // - Are filtered by the currently selected value of this filter
  // or if there is no currently selected value:
  // - Is the same like examinedProductIdSet
  const filteredByOtherFiltersSet = await otherFilters
    .filter((otherFilter) => otherFilter.key !== filter.key)
    .reduce(
      async (productIdSetPromise, otherFilter) => {
        if (otherFilter.key === filter.key) return productIdSetPromise;
        if (!filterQuery[otherFilter.key]) return productIdSetPromise;
        const productIdSet = await productIdSetPromise;
        const otherFilterProductIds = await filterProductIds(
          otherFilter,
          {
            values: filterQuery[otherFilter.key],
            forceLiveCollection,
          },
          unchainedAPI,
        );
        return intersectSet(productIdSet, new Set(otherFilterProductIds));
      },
      Promise.resolve(new Set(examinedProductIdSet)),
    );

  const filterProductIdsForValues = values
    ? await filterProductIds(
        filter,
        {
          values,
          forceLiveCollection,
        },
        unchainedAPI,
      )
    : filteredProductIds;

  const filteredProductIdSet = intersectSet(
    filteredByOtherFiltersSet,
    new Set(filterProductIdsForValues),
  );

  const productsCount = filterActions.aggregateProductIds({
    productIds: [...examinedProductIdSet],
  }).length;

  const filteredProductsCount = filterActions.aggregateProductIds({
    productIds: [...filteredProductIdSet],
  }).length;

  return {
    definition: filter,
    productsCount,
    filteredProductsCount,
    isSelected: Object.prototype.hasOwnProperty.call(filterQuery, filter.key),
    options: async () => {
      // The current base for options should be an array of product id's that:
      // - Are part of the preselected product id array
      // - Fit this filter generally
      // - Are filtered by all other filters
      // - Are not filtered by the currently selected value of this filter
      return findLoadedOptions(
        filter,
        {
          values,
          forceLiveCollection,
          productIdSet: filteredByOtherFiltersSet,
        },
        filterProductIds,
        filterActions,
        unchainedAPI,
      );
    },
  };
};
