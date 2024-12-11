import { Modules } from '../modules.js';
import { FilterDirector } from '../core-index.js';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:core');

export const invalidateFilterCacheService = async (unchainedAPI: {
  modules: Modules;
}): Promise<void> => {
  logger.debug('Filters: Start invalidating filter caches');

  const filters = await unchainedAPI.modules.filters.findFilters({ includeInactive: true });

  await filters.reduce(async (lastPromise, filter) => {
    await lastPromise;
    return FilterDirector.invalidateProductIdCache(filter, unchainedAPI);
  }, Promise.resolve(undefined));
};
