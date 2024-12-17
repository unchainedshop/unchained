import { Context } from '../../context.js';
import { SearchConfiguration } from '@unchainedshop/core-filters';

type SearchResultData = {
  searchConfiguration: SearchConfiguration & { productSelector: any };
  totalProductIds: Array<string>;
  aggregatedTotalProductIds: Array<string>;
  aggregatedFilteredProductIds: Array<string>;
};

export const ProductSearchResult = {
  productsCount: async (
    { searchConfiguration, aggregatedTotalProductIds }: SearchResultData,
    _: never,
    context: Context,
  ) => {
    if (aggregatedTotalProductIds?.length < 1) return 0;

    const { modules } = context;
    return modules.products.search.countFilteredProducts({
      productSelector: searchConfiguration.productSelector,
      productIds: aggregatedTotalProductIds,
    });
  },

  filteredProductsCount: async (
    { searchConfiguration, aggregatedFilteredProductIds }: SearchResultData,
    _: never,
    context: Context,
  ) => {
    if (aggregatedFilteredProductIds?.length < 1) return 0;

    const { modules } = context;
    return modules.products.search.countFilteredProducts({
      productSelector: searchConfiguration.productSelector,
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
      productSelector: searchConfiguration.productSelector,
      sort: searchConfiguration.sortStage,
    });
  },

  async filters({ searchConfiguration, totalProductIds }: SearchResultData, _: never, context: Context) {
    const { modules, services } = context;
    const relevantProductIds = await modules.products.findProductIds({
      productSelector: searchConfiguration.productSelector,
      productIds: totalProductIds,
      includeDrafts: searchConfiguration.searchQuery.includeInactive,
    });
    return services.filters.loadFilters(searchConfiguration.searchQuery, {
      productIds: relevantProductIds,
      forceLiveCollection: searchConfiguration.forceLiveCollection,
    });
  },
};
