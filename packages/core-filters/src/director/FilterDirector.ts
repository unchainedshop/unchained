import { FindOptions, Query } from '@unchainedshop/types/common';
import { FilterAdapterActions, IFilterAdapter, IFilterDirector } from '@unchainedshop/types/filters';
import { BaseDirector } from '@unchainedshop/utils';

const baseDirector = BaseDirector<IFilterAdapter>('FilterDirector', {
  adapterSortKey: 'orderIndex',
});

export const FilterDirector: IFilterDirector = {
  ...baseDirector,

  actions: async (filterContext, requestContext) => {
    const context = { ...filterContext, ...requestContext };
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
        return reduceAdapters<Query>(async (lastSelector, adapter) => {
          return adapter.transformProductSelector(await lastSelector, options);
        }, defaultSelector || null);
      },

      transformSortStage: (defaultStage, options) => {
        return reduceAdapters<FindOptions['sort']>(async (lastSortStage, adapter) => {
          return adapter.transformSortStage(await lastSortStage, options);
        }, defaultStage || null);
      },

      transformFilterSelector: async (defaultSelector) => {
        return reduceAdapters<Query>(async (lastSelector, adapter) => {
          return adapter.transformFilterSelector(await lastSelector);
        }, defaultSelector || null);
      },
    };
  },
};
