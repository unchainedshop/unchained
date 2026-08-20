import { mongodb } from '@unchainedshop/mongodb';
import makeMongoDBCache from './product-cache/mongodb.ts';

export interface FiltersSettings {
  setCachedProductIds: (
    filterId: string,
    productIds: string[],
    productIdsMap: Record<string, string[]>,
  ) => Promise<number>;
  getCachedProductIds: (filterId: string) => Promise<[string[], Record<string, string[]>] | null>;
  /* Drop the whole cache of a filter, used when the filter itself goes away. */
  purgeCachedProductIds: (filterId: string) => Promise<void>;
  configureSettings: (options: FiltersSettingsOptions, db: mongodb.Db) => void;
}

export type FiltersSettingsOptions = Omit<Partial<FiltersSettings>, 'configureSettings'>;

export const filtersSettings: FiltersSettings = {
  setCachedProductIds: () => Promise.resolve(0),
  getCachedProductIds: () => Promise.resolve(null),
  purgeCachedProductIds: () => Promise.resolve(),
  configureSettings: async ({ setCachedProductIds, getCachedProductIds, purgeCachedProductIds }, db) => {
    const defaultCache = await makeMongoDBCache(db);
    filtersSettings.setCachedProductIds = setCachedProductIds || defaultCache.setCachedProductIds;
    filtersSettings.getCachedProductIds = getCachedProductIds || defaultCache.getCachedProductIds;
    filtersSettings.purgeCachedProductIds = purgeCachedProductIds || defaultCache.purgeCachedProductIds;
  },
};
