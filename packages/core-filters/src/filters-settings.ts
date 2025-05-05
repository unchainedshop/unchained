import { mongodb } from '@unchainedshop/mongodb';
import makeMongoDBCache from './product-cache/mongodb.js';

export interface FiltersSettingsOptions {
  setCachedProductIds?: (
    filterId: string,
    productIds: string[],
    productIdsMap: Record<string, string[]>,
  ) => Promise<number>;
  getCachedProductIds?: (filterId: string) => Promise<[string[], Record<string, string[]>]>;
}

export interface FiltersSettings {
  setCachedProductIds?: (
    filterId: string,
    productIds: string[],
    productIdsMap: Record<string, string[]>,
  ) => Promise<number>;
  getCachedProductIds?: (filterId: string) => Promise<[string[], Record<string, string[]>]>;
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
