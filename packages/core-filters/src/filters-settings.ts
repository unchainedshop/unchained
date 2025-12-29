import { type DrizzleDb } from '@unchainedshop/store';
import makeDrizzleCache from './product-cache/drizzle.ts';

export interface FiltersSettings {
  setCachedProductIds: (
    filterId: string,
    productIds: string[],
    productIdsMap: Record<string, string[]>,
  ) => Promise<number>;
  getCachedProductIds: (filterId: string) => Promise<[string[], Record<string, string[]>] | null>;
  configureSettings: (options: FiltersSettingsOptions, db: DrizzleDb) => void;
}

export type FiltersSettingsOptions = Omit<Partial<FiltersSettings>, 'configureSettings'>;

export const filtersSettings: FiltersSettings = {
  setCachedProductIds: () => Promise.resolve(0),
  getCachedProductIds: () => Promise.resolve(null),
  configureSettings: async ({ setCachedProductIds, getCachedProductIds }, db) => {
    const defaultCache = makeDrizzleCache(db);
    filtersSettings.setCachedProductIds = setCachedProductIds || defaultCache.setCachedProductIds;
    filtersSettings.getCachedProductIds = getCachedProductIds || defaultCache.getCachedProductIds;
  },
};
