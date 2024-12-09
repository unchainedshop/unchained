import { mongodb } from '@unchainedshop/mongodb';
import { BaseDirector, IBaseDirector } from '@unchainedshop/utils';
import { FilterAdapterActions, FilterContext, IFilterAdapter } from './FilterAdapter.js';
import { Filter, filtersSettings, FilterType } from '@unchainedshop/core-filters';
import { Product } from '@unchainedshop/core-products';
import { Modules } from '../modules.js';

export type IFilterDirector = IBaseDirector<IFilterAdapter> & {
  actions: (filterContext: FilterContext, unchainedAPI) => Promise<FilterAdapterActions>;
  invalidateProductIdCache: (filter: Filter, unchainedAPI) => Promise<void>;
  findProductIds: (
    filter: Filter,
    { value }: { value?: boolean | string },
    unchainedAPI: { modules: Modules },
  ) => Promise<Array<string>>;
  buildProductIdMap: (
    filter: Filter,
    unchainedAPI: { modules: Modules },
  ) => Promise<[Array<string>, Record<string, Array<string>>]>;
  filterProductIds: (
    filter: Filter,
    { values, forceLiveCollection }: { values: Array<string>; forceLiveCollection?: boolean },
    unchainedAPI: { modules: Modules },
  ) => Promise<Array<string>>;
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
        return null;
      }
      return adapters.reduce(async (lastSearchPromise, adapter, index) => {
        return reducer(lastSearchPromise, adapter, index);
      }, Promise.resolve(initialValue));
    };

    return {
      aggregateProductIds: (params) => {
        const reducedProductIds = adapters.reduce(
          (productIds, adapter) => adapter.aggregateProductIds({ productIds }),
          params.productIds,
        );
        return reducedProductIds;
      },

      searchAssortments: async (params) => {
        return reduceAdapters<Array<string>>(async (lastSearchPromise, adapter) => {
          const assortmentIds = await lastSearchPromise;
          return adapter.searchAssortments({ assortmentIds });
        }, params.assortmentIds);
      },

      searchProducts: async (params) => {
        return reduceAdapters<Array<string>>(async (lastSearchPromise, adapter) => {
          const productIds = await lastSearchPromise;
          return adapter.searchProducts({ productIds });
        }, params.productIds);
      },

      transformProductSelector: async (defaultSelector, options) => {
        return reduceAdapters<mongodb.Filter<Product>>(async (lastSelector, adapter) => {
          return adapter.transformProductSelector(await lastSelector, options);
        }, defaultSelector || null);
      },

      transformSortStage: async (defaultStage, options) => {
        return reduceAdapters<mongodb.FindOptions<Product>['sort']>(async (lastSortStage, adapter) => {
          return adapter.transformSortStage(await lastSortStage, options);
        }, defaultStage || null);
      },

      transformFilterSelector: async (defaultSelector) => {
        return reduceAdapters<mongodb.Filter<Filter>>(async (lastSelector, adapter) => {
          return adapter.transformFilterSelector(await lastSelector);
        }, defaultSelector || null);
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
  ): Promise<[Array<string>, Record<string, Array<string>>]> {
    const allProductIds = await this.findProductIds(filter, {}, unchainedAPI);
    const productIdsMap =
      filter.type === FilterType.SWITCH
        ? {
            true: await this.findProductIds(filter, { value: true }, unchainedAPI),
            false: await this.findProductIds(filter, { value: false }, unchainedAPI),
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
    { values, forceLiveCollection }: { values: Array<string>; forceLiveCollection?: boolean },
    unchainedAPI: { modules: Modules },
  ) {
    const productIdMapTuple =
      (!forceLiveCollection && (await filtersSettings.getCachedProductIds(filter._id))) ||
      (await this.buildProductIdMap(filter, unchainedAPI));

    return unchainedAPI.modules.filters.parse(filter, values, productIdMapTuple);
  },

  async invalidateProductIdCache(filter: Filter, unchainedAPI: { modules: Modules }) {
    if (!filter) return;

    const [productIds, productIdMap] = await this.buildProductIdMap(filter, unchainedAPI);
    await filtersSettings.setCachedProductIds(filter._id, productIds, productIdMap);
  },
};
