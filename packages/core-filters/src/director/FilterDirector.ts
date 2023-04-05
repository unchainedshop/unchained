import { mongodb } from '@unchainedshop/mongodb';
import { FilterAdapterActions, IFilterAdapter, IFilterDirector } from '@unchainedshop/types/filters.js';
import { BaseDirector } from '@unchainedshop/utils';

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

      transformProductSelector: async <T extends mongodb.Document>(defaultSelector, options) => {
        return reduceAdapters<mongodb.UpdateFilter<T>>(async (lastSelector, adapter) => {
          return adapter.transformProductSelector(await lastSelector, options);
        }, defaultSelector || null);
      },

      transformSortStage: async <T extends mongodb.Document>(defaultStage, options) => {
        return reduceAdapters<mongodb.FindOptions<T>['sort']>(async (lastSortStage, adapter) => {
          return adapter.transformSortStage(await lastSortStage, options);
        }, defaultStage || null);
      },

      transformFilterSelector: async <T extends mongodb.Document>(defaultSelector) => {
        return reduceAdapters<mongodb.UpdateFilter<T>>(async (lastSelector, adapter) => {
          return adapter.transformFilterSelector(await lastSelector);
        }, defaultSelector || null);
      },
    };
  },
};
