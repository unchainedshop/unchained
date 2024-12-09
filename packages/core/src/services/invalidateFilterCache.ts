import { log, LogLevel } from '@unchainedshop/logger';
import { Modules } from '../modules.js';
import { FilterDirector } from '../core-index.js';

export const invalidateFilterCacheService = async (unchainedAPI: {
  modules: Modules;
}): Promise<void> => {
  log('Filters: Start invalidating filter caches', {
    level: LogLevel.Verbose,
  });

  const filters = await unchainedAPI.modules.filters.findFilters({ includeInactive: true });

  await filters.reduce(async (lastPromise, filter) => {
    await lastPromise;
    return FilterDirector.invalidateProductIdCache(filter, unchainedAPI);
  }, Promise.resolve(undefined));
};
