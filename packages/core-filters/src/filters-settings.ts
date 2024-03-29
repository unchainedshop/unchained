import { FiltersSettings } from '@unchainedshop/types/filters.js';
import makeMongoDBCache from './product-cache/mongodb.js';

export const filtersSettings: FiltersSettings = {
  setCachedProductIds: null,
  getCachedProductIds: null,
  skipInvalidationOnStartup: false,
  configureSettings: async (
    { setCachedProductIds, getCachedProductIds, skipInvalidationOnStartup },
    db,
  ) => {
    const defaultCache = await makeMongoDBCache(db);
    filtersSettings.skipInvalidationOnStartup = skipInvalidationOnStartup;
    filtersSettings.setCachedProductIds = setCachedProductIds || defaultCache.setCachedProductIds;
    filtersSettings.getCachedProductIds = getCachedProductIds || defaultCache.getCachedProductIds;
  },
};
