import { FiltersSettings } from '@unchainedshop/types/filters';
import makeMongoDBCache from './product-cache/mongodb';

export const filtersSettings: FiltersSettings = {
  setCachedProductIds: null,
  getCachedProductIds: null,
  configureSettings: async ({ setCachedProductIds, getCachedProductIds }, db) => {
    const defaultCache = await makeMongoDBCache(db);
    filtersSettings.setCachedProductIds = setCachedProductIds || defaultCache.setCachedProductIds;
    filtersSettings.getCachedProductIds = getCachedProductIds || defaultCache.getCachedProductIds;
  },
};
