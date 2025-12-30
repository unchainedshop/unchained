import type { Context } from '../../context.ts';
import type { SearchConfiguration } from '@unchainedshop/core-filters';

export interface SearchResultData {
  searchConfiguration: SearchConfiguration;
  totalProductIds: string[];
  aggregatedTotalProductIds: string[];
  aggregatedFilteredProductIds: string[];
}

export const ProductSearchResult = {
  productsCount: async ({ aggregatedTotalProductIds }: SearchResultData, _: never, context: Context) => {
    if (aggregatedTotalProductIds?.length < 1) return 0;

    const { modules } = context;
    return modules.products.search.countFilteredProducts({
      productIds: aggregatedTotalProductIds,
    });
  },

  filteredProductsCount: async (
    { aggregatedFilteredProductIds }: SearchResultData,
    _: never,
    context: Context,
  ) => {
    if (aggregatedFilteredProductIds?.length < 1) return 0;

    const { modules } = context;
    return modules.products.search.countFilteredProducts({
      productIds: aggregatedFilteredProductIds,
    });
  },

  products: async (
    { searchConfiguration, aggregatedFilteredProductIds }: SearchResultData,
    { offset, limit },
    context: Context,
  ) => {
    if (aggregatedFilteredProductIds?.length < 1) return [];

    const { modules } = context;
    return modules.products.search.findFilteredProducts({
      limit,
      offset,
      productIds: aggregatedFilteredProductIds,
      sort: searchConfiguration.sortStage,
    });
  },

  async filters({ searchConfiguration, totalProductIds }: SearchResultData, _: never, context: Context) {
    const { modules, services } = context;
    const relevantProductIds = await modules.products.findProductIds({
      productIds: totalProductIds,
      includeDrafts: searchConfiguration.searchQuery?.includeInactive,
    });
    return services.filters.loadFilters(searchConfiguration.searchQuery || {}, {
      locale: context.locale,
      userId: context.userId,
      productIds: relevantProductIds,
      forceLiveCollection: searchConfiguration.forceLiveCollection,
    });
  },
};
