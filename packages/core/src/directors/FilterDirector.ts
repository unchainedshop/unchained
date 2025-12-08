import { mongodb } from '@unchainedshop/mongodb';
import { BaseDirector, IBaseDirector } from '@unchainedshop/utils';
import { FilterAdapterActions, FilterContext, IFilterAdapter } from './FilterAdapter.js';
import {
  Filter,
  filtersSettings,
  FilterType,
  SearchConfiguration,
  SearchFilterQuery,
  SearchQuery,
} from '@unchainedshop/core-filters';
import { Product } from '@unchainedshop/core-products';
import { Modules } from '../modules.js';

export const parseQueryArray = (query?: SearchFilterQuery): Record<string, string[]> =>
  (query || []).reduce(
    (accumulator, { key, value }) => ({
      ...accumulator,
      [key]: accumulator[key] ? accumulator[key].concat(value) : [value],
    }),
    {},
  );

export type IFilterDirector = IBaseDirector<IFilterAdapter> & {
  actions: (
    filterContext: FilterContext,
    unchainedAPI: { modules: Modules },
  ) => Promise<FilterAdapterActions>;
  invalidateProductIdCache: (filter: Filter, unchainedAPI: { modules: Modules }) => Promise<void>;
  findProductIds: (
    filter: Filter,
    { value }: { value?: boolean | string },
    unchainedAPI: { modules: Modules },
  ) => Promise<string[]>;
  buildProductIdMap: (
    filter: Filter,
    unchainedAPI: { modules: Modules },
  ) => Promise<[string[], Record<string, string[]>]>;
  filterProductIds: (
    filter: Filter,
    { values, forceLiveCollection }: { values: string[]; forceLiveCollection?: boolean },
    unchainedAPI: { modules: Modules },
  ) => Promise<string[]>;

  filterFacets: (
    filter: Filter,
    params: {
      searchQuery: SearchQuery;
      forceLiveCollection?: boolean;
      allProductIds: string[];
      otherFilters: Filter[];
    },
    unchainedAPI: { modules: Modules },
  ) => Promise<{
    examinedProductIdSet: Set<string>;
    filteredByOtherFiltersSet: Set<string>;
    filteredByThisFilterSet: Set<string>;
  }>;

  productFacetedSearch: (
    productIds: string[],
    searchConfiguration: SearchConfiguration,
    unchainedAPI: { modules: Modules },
  ) => Promise<string[]>;
};

const baseDirector = BaseDirector<IFilterAdapter>('FilterDirector', {
  adapterSortKey: 'orderIndex',
});

export const FilterDirector: IFilterDirector = {
  ...baseDirector,

  actions: async (filterContext, unchainedAPI) => {
    const context = { ...filterContext, ...unchainedAPI };
    const adapters = baseDirector.getAdapters().map((Adapter) => Adapter.actions(context));

    const reduceAdapters = <V>(
      reducer: (currentValue: Promise<V>, adapter: FilterAdapterActions, index: number) => Promise<V>,
      initialValue: V,
    ) => {
      if (adapters.length === 0) {
        return initialValue;
      }
      return adapters.reduce(async (lastSearchPromise, adapter, index) => {
        return reducer(lastSearchPromise, adapter, index);
      }, Promise.resolve(initialValue));
    };

    return {
      aggregateProductIds: (params) => {
        return adapters.reduce(
          (productIds, adapter) => adapter.aggregateProductIds({ productIds }),
          params.productIds,
        );
      },

      searchAssortments: async (params, options) => {
        return reduceAdapters<string[] | undefined>(async (lastSearchPromise, adapter) => {
          const assortmentIds = await lastSearchPromise;
          return adapter.searchAssortments({ assortmentIds }, options);
        }, params.assortmentIds);
      },

      searchProducts: async (params, options) => {
        return reduceAdapters<string[] | undefined>(async (lastSearchPromise, adapter) => {
          const productIds = await lastSearchPromise;
          return adapter.searchProducts({ productIds }, options);
        }, params.productIds);
      },

      transformProductSelector: async (defaultSelector, options) => {
        return reduceAdapters<mongodb.Filter<Product>>(async (lastSelector, adapter) => {
          return adapter.transformProductSelector(await lastSelector, options);
        }, defaultSelector);
      },

      transformSortStage: async (defaultStage, options) => {
        return reduceAdapters<mongodb.FindOptions['sort']>(async (lastSortStage, adapter) => {
          return adapter.transformSortStage(await lastSortStage, options);
        }, defaultStage);
      },

      transformFilterSelector: async (defaultSelector, options) => {
        return reduceAdapters<mongodb.Filter<Filter>>(async (lastSelector, adapter) => {
          return adapter.transformFilterSelector(await lastSelector, options);
        }, defaultSelector);
      },
    };
  },

  async findProductIds(
    filter: Filter,
    { value }: { value?: boolean | string },
    unchainedAPI: { modules: Modules },
  ) {
    const { modules } = unchainedAPI;
    const director = await FilterDirector.actions({ filter, searchQuery: {} }, unchainedAPI);
    const productSelector = await director.transformProductSelector(
      modules.products.search.buildActiveDraftStatusFilter(),
      {
        key: filter.key,
        value,
      },
    );

    if (!productSelector) return [];
    return modules.products.findProductIds({
      productSelector,
      includeDrafts: true,
    });
  },

  async buildProductIdMap(
    filter: Filter,
    unchainedAPI: { modules: Modules },
  ): Promise<[string[], Record<string, string[]>]> {
    const allProductIds = await this.findProductIds(filter, {}, unchainedAPI);
    const productIdsMap =
      filter.type === FilterType.SWITCH
        ? {
            true: await this.findProductIds(filter, { value: true }, unchainedAPI),
            false: await this.findProductIds(filter, { value: { $in: [null, false] } }, unchainedAPI),
          }
        : await (filter.options || []).reduce(async (accumulatorPromise, option) => {
            const accumulator = await accumulatorPromise;
            return {
              ...accumulator,
              [option]: await this.findProductIds(filter, { value: option }, unchainedAPI),
            };
          }, Promise.resolve({}));

    return [allProductIds, productIdsMap];
  },

  async filterProductIds(
    filter: Filter,
    { values, forceLiveCollection }: { values: string[]; forceLiveCollection?: boolean },
    unchainedAPI: { modules: Modules },
  ) {
    const [allProductIds, keyToProductIdMap]: [string[], Record<string, string[]>] =
      (!forceLiveCollection && (await filtersSettings.getCachedProductIds(filter._id))) ||
      (await this.buildProductIdMap(filter, unchainedAPI));

    const filteredKeys = unchainedAPI.modules.filters.parse(
      filter,
      values,
      Object.keys(keyToProductIdMap),
    );
    const result: string[] = [];
    for (const key of filteredKeys) {
      const additionalValues = key === undefined ? allProductIds : keyToProductIdMap[key];
      if (additionalValues) {
        result.push(...additionalValues);
      }
    }
    return result;
  },

  async productFacetedSearch(
    productIds: string[],
    searchConfiguration: SearchConfiguration,
    unchainedAPI: { modules: Modules },
  ): Promise<string[]> {
    const { searchQuery, filterSelector, forceLiveCollection } = searchConfiguration;
    const { modules } = unchainedAPI;
    if (!searchQuery || !searchQuery.filterQuery) return productIds;

    const parsedFilterQuery = parseQueryArray(searchQuery.filterQuery);

    const filters = filterSelector
      ? await modules.filters.findFilters({
          ...filterSelector,
          limit: 0,
          includeInactive: true,
        })
      : [];

    const intersectedProductIds = await filters.reduce(
      async (productIdSetPromise: Promise<Set<string>>, filter) => {
        const productIdSet = await productIdSetPromise;

        if (!parsedFilterQuery[filter.key]) return productIdSet;

        const values = parsedFilterQuery[filter.key];

        const filterOptionProductIds = await this.filterProductIds(
          filter,
          {
            values,
            forceLiveCollection,
          },
          unchainedAPI,
        );

        return productIdSet.intersection(new Set(filterOptionProductIds));
      },
      Promise.resolve(new Set(productIds)),
    );

    return [...intersectedProductIds];
  },

  async filterFacets(filter, params, unchainedAPI) {
    const { allProductIds, searchQuery, forceLiveCollection, otherFilters } = params;

    const filterQueryParsed = parseQueryArray(searchQuery.filterQuery);

    // The examinedProductIdSet is a set of product id's that:
    // - Fit this filter generally
    // - Are part of the preselected product id array
    const filteredProductIds = await this.filterProductIds(
      filter,
      {
        values: [undefined],
        forceLiveCollection,
      },
      unchainedAPI,
    );

    // Optimize: Create Set from allProductIds, iterate through smaller filteredProductIds
    const allSet = new Set(allProductIds);
    const examinedProductIdSet = new Set<string>();
    for (const id of filteredProductIds) {
      if (allSet.has(id)) examinedProductIdSet.add(id);
    }
    const values = filterQueryParsed[filter.key];

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
          if (!filterQueryParsed[otherFilter.key]) return productIdSetPromise;
          const productIdSet = await productIdSetPromise;
          const otherFilterProductIds = await this.filterProductIds(
            otherFilter,
            {
              values: filterQueryParsed[otherFilter.key],
              forceLiveCollection,
            },
            unchainedAPI,
          );
          return productIdSet.intersection(new Set(otherFilterProductIds));
        },
        Promise.resolve(new Set(examinedProductIdSet)),
      );

    const filterProductIdsForValues = values
      ? await this.filterProductIds(
          filter,
          {
            values,
            forceLiveCollection,
          },
          unchainedAPI,
        )
      : filteredProductIds;

    const filteredByThisFilterSet = new Set<string>(filterProductIdsForValues);

    return {
      examinedProductIdSet,
      filteredByOtherFiltersSet,
      filteredByThisFilterSet,
    };
  },

  async invalidateProductIdCache(filter: Filter, unchainedAPI: { modules: Modules }) {
    if (!filter) return;

    const [productIds, productIdMap] = await this.buildProductIdMap(filter, unchainedAPI);
    await filtersSettings.setCachedProductIds(filter._id, productIds, productIdMap);
  },
};
