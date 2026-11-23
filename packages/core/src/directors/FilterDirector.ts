import { mongodb } from '@unchainedshop/mongodb';
import type { IBaseDirector } from '@unchainedshop/utils';
import type { FilterAdapterActions, FilterContext, IFilterAdapter } from './FilterAdapter.ts';
import {
  type Filter,
  filterCacheGeneration,
  filterOptionValues,
  filtersSettings,
  FilterType,
  type SearchConfiguration,
  type SearchFilterQuery,
  type SearchQuery,
} from '@unchainedshop/core-filters';
import type { Product } from '@unchainedshop/core-products';
import type { Modules } from '../modules.ts';
import { registryDirector } from './registryDirector.ts';
import { FilterAdapter } from './FilterAdapter.ts';

// One Set per cached product id array. Cache backends hand out new arrays when memberships change
// and never modify one they returned, and callers get the Sets read-only, so a Set stays right for
// as long as its array lives.
const productIdSets = new WeakMap<string[], Set<string>>();
const asSet = (productIds: string[]) => {
  let set = productIdSets.get(productIds);
  if (!set) {
    set = new Set(productIds);
    productIdSets.set(productIds, set);
  }
  return set;
};

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
  hasGeneratedOptions: (filter: Filter) => boolean;
  optionValues: (filter: Filter) => Promise<string[]>;
  findProductIds: (
    filter: Filter,
    { value }: { value?: boolean | string },
    unchainedAPI: { modules: Modules },
  ) => Promise<string[]>;
  buildProductIdMap: (
    filter: Filter,
    unchainedAPI: { modules: Modules },
  ) => Promise<[string[], Record<string, string[]>]>;
  /* The Set can be shared with other callers and later searches: intersect it, never change it. */
  filterProductIds: (
    filter: Filter,
    { values, forceLiveCollection }: { values: string[]; forceLiveCollection?: boolean },
    unchainedAPI: { modules: Modules },
  ) => Promise<ReadonlySet<string>>;

  filterFacets: (
    filter: Filter,
    params: {
      searchQuery: SearchQuery;
      forceLiveCollection?: boolean;
      allProductIdSet: Set<string>;
      otherFilters: Filter[];
    },
    unchainedAPI: { modules: Modules },
  ) => Promise<{
    examinedProductIdSet: Set<string>;
    filteredByOtherFiltersSet: Set<string>;
    filteredByThisFilterSet: ReadonlySet<string>;
  }>;

  productFacetedSearch: (
    productIds: string[],
    searchConfiguration: SearchConfiguration,
    unchainedAPI: { modules: Modules },
  ) => Promise<string[]>;
};

const generatedOptionsOf = (filter: Filter) =>
  FilterDirector.getAdapters().find((adapter) => adapter.generatedOptions?.appliesTo(filter))
    ?.generatedOptions;

export const FilterDirector: IFilterDirector = {
  ...registryDirector<IFilterAdapter>(FilterAdapter.adapterType!),

  hasGeneratedOptions(filter) {
    return Boolean(generatedOptionsOf(filter));
  },

  async optionValues(filter) {
    if (!generatedOptionsOf(filter)) return filterOptionValues(filter);
    const [, productIdMap] = (await filtersSettings.getCachedProductIds(filter._id)) || [[], {}];
    return Object.keys(productIdMap).toSorted((left, right) =>
      left.localeCompare(right, undefined, { numeric: true }),
    );
  },

  actions: async (filterContext, unchainedAPI) => {
    const context = { ...filterContext, ...unchainedAPI };
    const adapters = FilterDirector.getAdapters().map((Adapter) => Adapter.actions(context));

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

    if (filter.type === FilterType.SWITCH) {
      return [
        allProductIds,
        {
          true: await this.findProductIds(filter, { value: true }, unchainedAPI),
          false: await this.findProductIds(filter, { value: { $in: [null, false] } }, unchainedAPI),
        },
      ];
    }

    // Collected into one object instead of respreading the accumulator per option: that is
    // quadratic, and a filter can carry thousands of options. The lookups stay sequential on
    // purpose, so rebuilding a large filter does not flood the database with parallel scans.
    //
    // Null-prototyped because option values are arbitrary strings: assigning `__proto__` into a
    // normal object walks into the prototype setter instead of creating a key, and the option
    // would then be missing from everything derived from this map.
    const productIdsMap: Record<string, string[]> = Object.create(null);
    for (const option of filter.options || []) {
      productIdsMap[option] = await this.findProductIds(filter, { value: option }, unchainedAPI);
    }

    return [allProductIds, productIdsMap];
  },

  async filterProductIds(
    filter: Filter,
    { values, forceLiveCollection }: { values: string[]; forceLiveCollection?: boolean },
    unchainedAPI: { modules: Modules },
  ): Promise<ReadonlySet<string>> {
    const [allProductIds, keyToProductIdMap]: [string[], Record<string, string[]>] =
      (!forceLiveCollection && (await filtersSettings.getCachedProductIds(filter._id))) ||
      (await this.buildProductIdMap(filter, unchainedAPI));

    const filteredKeys = unchainedAPI.modules.filters.parse(
      filter,
      values,
      Object.keys(keyToProductIdMap),
    );

    if (filteredKeys.includes(undefined)) return asSet(allProductIds);

    // Own properties only. The keys come straight from a user supplied filterQuery, so
    // asking for `constructor` or `toString` would otherwise reach Object.prototype and
    // throw while iterating it.
    const keys = (filteredKeys as string[]).filter(
      (key) => Object.hasOwn(keyToProductIdMap, key) && keyToProductIdMap[key],
    );
    if (keys.length === 1) return asSet(keyToProductIdMap[keys[0]]);

    const result = new Set<string>();
    for (const key of keys) {
      for (const val of keyToProductIdMap[key]) result.add(val);
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

    if (searchQuery.strictFilterQuery) {
      const inapplicableKey = Object.keys(parsedFilterQuery).find(
        (key) => !filters.some((filter) => filter.key === key),
      );
      if (inapplicableKey) {
        throw new Error(`Filter ${inapplicableKey} does not apply to this search`, {
          cause: 'FILTER_NOT_APPLICABLE',
        });
      }
    }

    const selectedProductIdSets = await Promise.all(
      filters
        .filter((filter) => parsedFilterQuery[filter.key])
        .map((filter) =>
          this.filterProductIds(
            filter,
            { values: parsedFilterQuery[filter.key], forceLiveCollection },
            unchainedAPI,
          ),
        ),
    );
    const intersectedProductIds = selectedProductIdSets.reduce(
      (productIdSet, filterOptionProductIds) => productIdSet.intersection(filterOptionProductIds),
      new Set(productIds),
    );

    return productIds.filter((productId) => intersectedProductIds.has(productId));
  },

  async filterFacets(filter, params, unchainedAPI) {
    const { allProductIdSet, searchQuery, forceLiveCollection, otherFilters } = params;

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
    const examinedProductIdSet = allProductIdSet.intersection(filteredProductIds);
    const values = filterQueryParsed[filter.key];

    // The filteredProductIds is a set of product id's that:
    // - Are filtered by all other filters
    // - Are filtered by the currently selected value of this filter
    // or if there is no currently selected value:
    // - Is the same like examinedProductIdSet
    const filteredByOtherFiltersSet = await otherFilters
      .filter((otherFilter) => otherFilter.key !== filter.key)
      .reduce(async (productIdSetPromise, otherFilter) => {
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
        return productIdSet.intersection(otherFilterProductIds);
      }, Promise.resolve(examinedProductIdSet));

    const filteredByThisFilterSet = values
      ? await this.filterProductIds(
          filter,
          {
            values,
            forceLiveCollection,
          },
          unchainedAPI,
        )
      : filteredProductIds;

    return {
      examinedProductIdSet,
      filteredByOtherFiltersSet,
      filteredByThisFilterSet,
    };
  },

  async invalidateProductIdCache(filter: Filter, unchainedAPI: { modules: Modules }) {
    if (!filter) return;

    const generatedOptions = generatedOptionsOf(filter);
    const [productIds, productIdMap] = generatedOptions
      ? await generatedOptions.buildProductIdMap(filter, unchainedAPI)
      : await this.buildProductIdMap(filter, unchainedAPI);

    // A deleted filter has no generation left to be overtaken by, so it needs its own check.
    // This is about not rebuilding the cache of something that no longer exists rather than
    // about correctness: a rebuild that slips past it leaves orphan rows, not wrong answers,
    // because nothing can query a filter that is gone.
    if (!(await unchainedAPI.modules.filters.filterExists({ filterId: filter._id }))) return;

    // Stamped with the generation this map was built from, so a rebuild that has been overtaken
    // while it scanned cannot publish ids computed against a filter that has since changed.
    await filtersSettings.setCachedProductIds(
      filter._id,
      productIds,
      productIdMap,
      filterCacheGeneration(filter),
    );
  },
};
