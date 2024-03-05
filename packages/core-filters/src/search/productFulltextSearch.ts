import { SearchProductConfiguration } from './search.js';

export const productFulltextSearch = (params: SearchProductConfiguration) => {
  return async (productIds: Array<string>) => {
    const foundProductIds = await params.filterActions.searchProducts({ productIds }, params);
    return foundProductIds || [];
  };
};
