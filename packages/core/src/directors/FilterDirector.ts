import { mongodb } from '@unchainedshop/mongodb';
import { BaseDirector, IBaseDirector } from '@unchainedshop/utils';
import { FilterAdapterActions, FilterContext, IFilterAdapter } from './FilterAdapter.js';
import { Filter } from '@unchainedshop/core-filters';
import { Product } from '@unchainedshop/core-products';

export type IFilterDirector = IBaseDirector<IFilterAdapter> & {
  actions: (filterContext: FilterContext, unchainedAPI) => Promise<FilterAdapterActions>;
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
};
