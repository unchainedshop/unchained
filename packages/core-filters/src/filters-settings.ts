import { mongodb } from '@unchainedshop/mongodb';
import { createLogger } from '@unchainedshop/logger';
import makeMongoDBCache from './product-cache/mongodb.ts';

const logger = createLogger('unchained:core-filters');

export interface FiltersSettings {
  /*
   * Replaces the cached product ids of a filter. `productIdsMap` is the complete set of values it
   * can be queried by, so an implementation is expected to retire keys it does not mention.
   *
   * `computedAt` is the filter generation the map was built from, see filterCacheGeneration.
   * Rebuilding is slow enough to be overtaken, so an implementation must not let an older
   * generation overwrite or retire what a newer one has already written.
   */
  setCachedProductIds: (
    filterId: string,
    productIds: string[],
    productIdsMap: Record<string, string[]>,
    computedAt: number,
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
    // Each member falls back on its own, so overriding only some of them silently runs two
    // cache backends side by side - reading from one and writing to the other.
    const overridden = [setCachedProductIds, getCachedProductIds, purgeCachedProductIds].filter(Boolean);
    if (overridden.length && overridden.length < 3) {
      logger.warn(
        'Product id cache is only partially overridden, the remaining members fall back to the MongoDB cache. Provide setCachedProductIds, getCachedProductIds and purgeCachedProductIds together.',
      );
    }

    // Instantiated only when something still needs it. makeMongoDBCache provisions the Mongo
    // cache collection and its indexes, so a backend that overrides every member must not trigger
    // it - otherwise a Redis/HTTP shop gets an orphan Mongo collection it never reads.
    const defaultCache =
      setCachedProductIds && getCachedProductIds && purgeCachedProductIds
        ? null
        : await makeMongoDBCache(db);
    filtersSettings.setCachedProductIds = setCachedProductIds || defaultCache!.setCachedProductIds;
    filtersSettings.getCachedProductIds = getCachedProductIds || defaultCache!.getCachedProductIds;
    filtersSettings.purgeCachedProductIds = purgeCachedProductIds || defaultCache!.purgeCachedProductIds;
  },
};
