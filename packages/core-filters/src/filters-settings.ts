import { mongodb } from '@unchainedshop/mongodb';
import makeMongoDBCache from './product-cache/mongodb.js';

export interface FiltersSettingsOptions {
  setCachedProductIds?: (
    filterId: string,
    productIds: Array<string>,
    productIdsMap: Record<string, Array<string>>,
  ) => Promise<number>;
  getCachedProductIds?: (filterId: string) => Promise<[Array<string>, Record<string, Array<string>>]>;
}

export interface FiltersSettings {
  setCachedProductIds?: (
    filterId: string,
    productIds: Array<string>,
    productIdsMap: Record<string, Array<string>>,
  ) => Promise<number>;
  getCachedProductIds?: (filterId: string) => Promise<[Array<string>, Record<string, Array<string>>]>;
  configureSettings: (options: FiltersSettingsOptions, db: mongodb.Db) => void;
}

export const filtersSettings: FiltersSettings = {
  setCachedProductIds: null,
  getCachedProductIds: null,
  configureSettings: async ({ setCachedProductIds, getCachedProductIds }, db) => {
    const defaultCache = await makeMongoDBCache(db);
    filtersSettings.setCachedProductIds = setCachedProductIds || defaultCache.setCachedProductIds;
    filtersSettings.getCachedProductIds = getCachedProductIds || defaultCache.getCachedProductIds;
  },
};
