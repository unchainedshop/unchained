import { FiltersSettings, FiltersSettingsOptions } from '@unchainedshop/types/filters';
import { Db } from '@unchainedshop/types/common';
import makeMongoDBCache from './product-cache/mongodb';

export const filtersSettings: FiltersSettings = {
    setCachedProductIds: null,
    getCachedProductIds: null,
    configureSettings: async (
        {
            setCachedProductIds,
            getCachedProductIds,
        },
        db,
    ) => {
        const defaultCache = await makeMongoDBCache(db);
        filtersSettings.setCachedProductIds = setCachedProductIds || defaultCache.setCachedProductIds;
        filtersSettings.getCachedProductIds = getCachedProductIds || defaultCache.getCachedProductIds;
    },
};
