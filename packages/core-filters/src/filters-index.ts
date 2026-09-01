export * from './db/FiltersCollection.ts';
export * from './module/configureFiltersModule.ts';
export * from './search.ts';
export * from './filters-settings.ts';
// The record type moved to the Mongo cache backend that owns the collection; re-exported here so
// the package's public surface is unchanged.
export type { FilterProductIdCacheRecord } from './product-cache/mongodb.ts';
