import { FiltersSettings } from '@unchainedshop/types/filters.js';
import makeMongoDBCache from './product-cache/mongodb.js';

export const filtersSettings: FiltersSettings = {
  setCachedProductIds: null,
  getCachedProductIds: null,
  configureSettings: async ({ setCachedProductIds, getCachedProductIds }, db) => {
    const defaultCache = await makeMongoDBCache(db);
    filtersSettings.setCachedProductIds = setCachedProductIds || defaultCache.setCachedProductIds;
    filtersSettings.getCachedProductIds = getCachedProductIds || defaultCache.getCachedProductIds;
  },
};
