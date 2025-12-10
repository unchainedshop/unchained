import type { Modules } from '../modules.ts';
import { FilterDirector } from '../core-index.ts';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:core');

export async function invalidateFilterCacheService(this: Modules) {
  logger.debug('Filters: Start invalidating filter caches');

  const filters = await this.filters.findFilters({ includeInactive: true });

  await filters.reduce(async (lastPromise, filter) => {
    await lastPromise;
    return FilterDirector.invalidateProductIdCache(filter, { modules: this });
  }, Promise.resolve(undefined));
}
